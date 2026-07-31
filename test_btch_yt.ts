import { getBtch } from './src/lib/lazyImports';
async function run() {
    const b = await getBtch();
    const res = await b.youtube("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    console.log(res);
}
run();
