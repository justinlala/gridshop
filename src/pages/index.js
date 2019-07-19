import React from "react"
import { Link, graphql } from "gatsby"

import Bio from "../components/bio"
import Layout from "../components/layout"
import SEO from "../components/seo"
import { rhythm } from "../utils/typography"

class BlogIndex extends React.Component {
  render() {
    const { data } = this.props
    const siteTitle = data.site.siteMetadata.title
    const products = data.allProduct.edges

    return (
      <Layout location={this.props.location} title={siteTitle}>
        <SEO title="All posts" />
        <Bio />
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'baseline',
            justifyContent: 'space-between'
          }}
        >
          {products.map(({ node }) => {
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
                  <a style={{ boxShadow: `none` }} href={node.link}>
                    {title}
                    <img src={node.images[0]}/>
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

export default BlogIndex

export const pageQuery = graphql`
  query {
    site {
      siteMetadata {
        title
      }
    }
    allProduct {
     edges {
       node {
         id
         images
         link
         title
        }
      }
    }
  }
`
