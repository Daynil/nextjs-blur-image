import BlurImage from '../components/blur-image';
import Layout from '../components/Layout';
import { getRouteImageMeta } from '../utils/image-api';

export default function Index({ imgMeta }) {
  return (
    <Layout>
      <h1>Page 2</h1>
      <BlurImage alt="Gray cat" {...imgMeta['test-image.png']} />
      <BlurImage alt="Kitchen cat" {...imgMeta['kitchen-cat.jpg']} />
    </Layout>
  );
}

export async function getStaticProps() {
  return { props: { imgMeta: await getRouteImageMeta('page-2', true) } };
}
