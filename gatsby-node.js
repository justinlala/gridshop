const path = require(`path`)
const axios = require('axios')
const crypto = require('crypto');
const convert = require('xml-js');
const htmlToJson = require('html-to-json');
const { createFilePath } = require(`gatsby-source-filesystem`)

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions

  const blogPost = path.resolve(`./src/templates/blog-post.js`)
  const result = await graphql(
    `
      {
        allMarkdownRemark(
          sort: { fields: [frontmatter___date], order: DESC }
          limit: 1000
        ) {
          edges {
            node {
              fields {
                slug
              }
              frontmatter {
                title
              }
            }
          }
        }
      }
    `
  )

  if (result.errors) {
    throw result.errors
  }

  // Create blog posts pages.
  const posts = result.data.allMarkdownRemark.edges

  posts.forEach((post, index) => {
    const previous = index === posts.length - 1 ? null : posts[index + 1].node
    const next = index === 0 ? null : posts[index - 1].node

    createPage({
      path: post.node.fields.slug,
      component: blogPost,
      context: {
        slug: post.node.fields.slug,
        previous,
        next,
      },
    })
  })
}


exports.sourceNodes = async ({ boundActionCreators }) => {
  const { createNode } = boundActionCreators;

  const getCompanyUrls = () => htmlToJson.request('https://www.cpgd.xyz/all?91c78504_page=0', {
    'links': ['a.link-block-7', function ($a) {
      return $a.attr('href');
    }]
  }, function (err, result) {
    return result;
  });

  const urls = await getCompanyUrls();

  async function fetchProducts(url) {
    try {
      const response = await axios.get(`${url}/collections/all.atom`);
      return response;
    } catch (error) {
      return;
    }
  }

  const results = await Promise.all(urls.links.slice(1,9).map((url) => fetchProducts(url)));


  const jsonData = results.flatMap((result) => {
    if(result) return convert.xml2json(result.data, {compact: true});
  })

  const jsonProducts = jsonData.filter(n => n).flatMap((data) => {
    return JSON.parse(data).feed.entry;
  })

  // map into these results and create nodes
  jsonProducts.map( async (product, i) => {

    const getImage = () => htmlToJson.parse(product.summary["_cdata"], {
      'images': ['img', function ($img) {
        return $img.attr('src');
      }]
    }, function (err, result) {
      return result
    })

    const imageResult = await getImage();
    // Create your node object
    const productNode = {
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
