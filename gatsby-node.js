const path = require(`path`)
const axios = require('axios')
const crypto = require('crypto');
const convert = require('xml-js');
const htmlToJson = require('html-to-json');
const { createFilePath } = require(`gatsby-source-filesystem`)

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions

  const collectionPage = path.resolve(`./src/templates/collectionPage.js`)
  const result = await graphql(
    `
      {
        allProduct {
          distinct(field: s_vendor____text)
        }
      }
    `
  )

  if (result.errors) {
    throw result.errors
  }

  // Create blog posts pages.
  const collections = result.data.allProduct.distinct

  collections.forEach((collection, index) => {

    createPage({
      path: `company/${collection}`,
      component: collectionPage,
      context: {
        slug: collection
      }
    })
  })
}


exports.sourceNodes = async ({ boundActionCreators }) => {
  const { createNode } = boundActionCreators;

  const getCompanyUrls = (pageNumber) => htmlToJson.request(`https://www.cpgd.xyz/all?91c78504_page=${pageNumber}`, {
    'links': ['a.link-block-7', function ($a) {
      return $a.attr('href');
    }]
  }, function (err, result) {
    return result;
  });

  const urls = await Promise.all([1,2].map((pageNumber) => getCompanyUrls(pageNumber)));

  async function fetchProducts(url) {
    try {
      const response = await axios.get(`${url}/collections/all.atom`);
      return response;
    } catch (error) {
      return;
    }
  }
  console.log(urls);
  const results = await Promise.all(urls.flatMap((url) => url.links).map((url) => fetchProducts(url)));


  const jsonData = results.flatMap((result) => {
    if(result) {
      try {
        return convert.xml2json(result.data, {compact: true});
      }
      catch {
        return;
      }
    }
  })

  const jsonProducts = jsonData.filter(n => n).flatMap((data) => {
    return JSON.parse(data).feed.entry;
  })

  // map into these results and create nodes
  jsonProducts.map( async (product, i) => {

    if(!product) return;
    const getImage = () => htmlToJson.parse(product.summary["_cdata"], {
      'images': ['img', function ($img) {
        return $img.attr('src');
      }]
    }, function (err, result) {
      return result
    })

    const imageResult = await getImage();
    // Create your node object
    const productNode = {...product,
      // Required fields

      id: `${i}`,
      parent: `__SOURCE__`,
      internal: {
        type: `Product`, // name of the graphQL query --> allRandomUser {}
        // contentDigest will be added just after
        // but it is required
      },
      children: [],
      title: product.title["_text"],
      link: product.link["_attributes"]["href"],
      images: imageResult.images
    }

    // Get content digest of node. (Required field)
    const contentDigest = crypto
      .createHash(`md5`)
      .update(JSON.stringify(productNode))
      .digest(`hex`);
    // add it to userNode
    productNode.internal.contentDigest = contentDigest;

    // Create node with the gatsby createNode() API
    createNode(productNode);
  });

  return;
}


exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions

  if (node.internal.type === `MarkdownRemark`) {
    const value = createFilePath({ node, getNode })
    createNodeField({
      name: `slug`,
      node,
      value,
    })
  }
}
