import fs from 'fs';
import matter from 'gray-matter';
import hydrate from 'next-mdx-remote/hydrate';
import renderToString from 'next-mdx-remote/render-to-string';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import Link from 'next/link';
import path from 'path';
import visit from 'unist-util-visit';
import BlurImage from '../../components/blur-image';
import CustomLink from '../../components/CustomLink';
import Layout from '../../components/Layout';
import { getRouteImageMeta } from '../../utils/image-api';
import { postFilePaths, POSTS_PATH } from '../../utils/mdxUtils';

// Custom components/renderers to pass to MDX.
// Since the MDX files aren't loaded by webpack, they have no knowledge of how
// to handle import statements. Instead, you must include components in scope
// here.
const components = {
  a: CustomLink,
  // It also works with dynamically-imported components, which is especially
  // useful for conditionally loading components for certain routes.
  // See the notes in README.md for more details.
  TestComponent: dynamic(() => import('../../components/TestComponent')),
  Head,
  BlurImage: BlurImage
};

export default function PostPage({ source, frontMatter }) {
  const content = hydrate(source, { components });
  return (
    <Layout>
      <header>
        <nav>
          <Link href="/">
            <a>👈 Go back home</a>
          </Link>
        </nav>
      </header>
      <div className="post-header">
        <h1>{frontMatter.title}</h1>
        {frontMatter.description && (
          <p className="description">{frontMatter.description}</p>
        )}
      </div>
      <main>{content}</main>

      <style jsx>{`
        .post-header h1 {
          margin-bottom: 0;
        }

        .post-header {
          margin-bottom: 2rem;
        }
        .description {
          opacity: 0.6;
        }
      `}</style>
    </Layout>
  );
}

export const getStaticProps = async ({ params }) => {
  const postFilePath = path.join(POSTS_PATH, `${params.slug}.mdx`);
  const source = fs.readFileSync(postFilePath);

  const { content, data } = matter(source);

  const imgMeta = await getRouteImageMeta(
    path.join('posts', params.slug),
    false
  );

  const mdxSource = await renderToString(content, {
    components,
    // Optionally pass remark/rehype plugins
    mdxOptions: {
      remarkPlugins: [
        function () {
          return transformer;

          function transformer(tree) {
            visit(tree, 'image', visitor);

            function visitor(node) {
              if (!imgMeta) return;
              const meta = imgMeta[node.url.split('./')[1]];

              node.type = 'jsx';
              node.value = `<BlurImage
                              fileName="${meta.fileName}"
                              relativePath="${meta.relativePath}"
                              width={${meta.width}}
                              height={${meta.height}}
                              imgBase64="${meta.imgBase64}" />`;
            }
          }
        }
      ],
      rehypePlugins: []
    },
    scope: data
  });

  return {
    props: {
      source: mdxSource,
      frontMatter: data
    }
  };
};

export const getStaticPaths = async () => {
  const paths = postFilePaths
    // Remove file extensions for page paths
    .map((path) => path.replace(/\.mdx?$/, ''))
    // Map the path into the static paths object required by Next.js
    .map((slug) => ({ params: { slug } }));

  return {
    paths,
    fallback: false
  };
};
