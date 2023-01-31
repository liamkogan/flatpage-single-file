import * as fs from 'fs';
import { minify } from 'html-minifier-terser';
export default function astroSingleFile() {
    return {
        name: 'astro-single-file',
        hooks: {
            'astro:build:done': async ({ dir }) => {
                var folder = dir.pathname;
                folder = folder.replace('%20', ' ')
                console.log(folder)
                const files = fs.readdirSync(folder).reduce((acc, f) => {
                    const file = `${folder}${f}`;
                    if (fs.statSync(file).isFile()) {
                        acc.push(file);
                    }
                    else if (fs.statSync(file).isDirectory()) {
                        acc = acc.concat(fs.readdirSync(file).map(f => `${file}/${f}`));
                    }
                    return acc;
                }, []);
                function openFiles(fileType) {
                    return files
                        .filter((i) => i.endsWith(`.${fileType}`))
                        .map(path => ({ contents: fs.readFileSync(path, 'utf8'), path, fileName: path.split('/').pop() }));
                }
                const htmlFiles = openFiles('html');
                const cssAssets = openFiles('css');

                function removeHTML(html) {

                    var regex =  new RegExp(`((.|\n)*?)(?=\<style>)`)
                    var headre =  new RegExp(`\<\/head>((.|\n)*)<main`)
                    var endre = new RegExp(`\<\/main>((.|\n)*)`)

                    var newHTML = html.replace(regex, '').replace(headre,'<main').replace(endre,'</main>')

                    return newHTML

                    // console.log(typeof htmls)
                    // try {
                    //     var newHTML = htmls.replace(regex, '')
                    //     console.log(newHTML)
                    //     return newHTML
                    // } catch (error) {
                    //     console.log(error)
                    // } finally {
                    //     return
                    // }
                }


                function replaceCss(html, cssFilename, cssStyles) {
                    const reCss = new RegExp(`<link[^>]*? href=".*${cssFilename}"[^>]*?>`);
                    const inlined = html.replace(reCss, `<style type="text/css">\n${cssStyles}\n</style>`);
                    return inlined;
                }
                for (const html of htmlFiles) {
                    for (const css of cssAssets) {
                        html.contents = replaceCss(html.contents, css.fileName, css.contents);
                    }
                    console.log(html.contents)
                    // html.contents = removeHTML(html.contents)
                    console.log('returned')

                    var mini = await minify(html.contents, {
                        collapseWhitespace: true,
                        keepClosingSlash: true,
                        removeComments: true,
                        removeRedundantAttributes: true,
                        removeScriptTypeAttributes: true,
                        removeStyleLinkTypeAttributes: true,
                        useShortDoctype: true,
                        minifyCSS: true,
                    })

                    var less = removeHTML(mini)

                    fs.writeFileSync(html.path, less);
                }
                for (const { path } of cssAssets) {
                    fs.unlinkSync(path);
                }
                fs.readdirSync(folder).forEach(f => {
                    const file = `${folder}${f}`;
                    if (fs.statSync(file).isDirectory() && fs.readdirSync(file).length === 0) {
                        fs.rmdirSync(file);
                    }
                });
            }
        }
    };
}
