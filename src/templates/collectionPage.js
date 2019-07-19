import React from "react"
import { Link, graphql } from "gatsby"

import Bio from "../components/bio"
import Layout from "../components/layout"
import SEO from "../components/seo"
import { rhythm } from "../utils/typography"

class CollectionPage extends React.Component {
  render() {
    const { data } = this.props
    const siteTitle = data.site.siteMetadata.title
    const products = data.allProduct.edges

    return (
      <Layout location={this.props.location} title={siteTitle}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'baseline',
            justifyContent: 'space-between'
          }}
        >
          {products.map(({ node }) => {

            if(node.images[0] === "#") return;
            const title = node.title
            return (
              <div
                key={node.id}
                style={{
                  width: '300px'
                }}
              >
                <h3
                  style={{
                    marginBottom: rhythm(1 / 4),
                  }}
                >
                  <a style={{ boxShadow: `none` }} href={node.link} target="_blank">
                    <div
                      style={{
                        fontSize: '0.5em',
                        marginBottom: '10px'
                      }}
                    >
                      {node["s_vendor"]["_text"]}
                    </div>
                    <img src={node.images[0]}/>
                    {title}
                  </a>
                </h3>
              </div>
            )
          })}
        </div>

      </Layout>
    )
  }
}

export default CollectionPage

export const pageQuery = graphql`
  query ProductsByCompany($slug: String!) {
    site {
      siteMetadata {
        title
        author
      }
    }
    allProduct(filter: {s_vendor: {_text: {eq: $slug}}}) {
      edges {
        node {
          id
          images
          link
          title
          s_vendor {
            _text
          }
         }
       }
    }
  }
`
