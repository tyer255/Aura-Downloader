import * as igdlModule from 'igdl.js';
async function test() {
    try {
        console.log(igdlModule);
        const res = await (igdlModule as any).igdl('https://www.instagram.com/reel/DEZc6oSSg7E/');
        console.log(res);
    } catch(e) {
        console.error(e);
    }
}
test();
