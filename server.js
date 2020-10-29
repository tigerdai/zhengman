var http = require("http");
var url = require("url");
var fs = require('fs');
const querystring = require('querystring');
const {stat} = require('fs').promises

function start(route) {
    async function  onRequest(request, response) {
        var pathname = url.parse(request.url).pathname;
        var path = url.parse(request.url).path
        console.log("path " + path);
        route(pathname);
        if (path == '/') {
            response.writeHead(200, { "Content-Type": "text/html" });
            fs.readFile('./index.html', (error, data) => {
                if (error) throw error
                response.write(data)
                response.end()
            })
        }
        else if (path == "/main") {
            let arr = []
            request.on('data', buffer => {
                arr.push(buffer)
            })
            request.on('end', () => {
                let buf = Buffer.concat(arr);
                let post = querystring.parse(buf.toString());
                if (post.password == "蚕学") {
                    response.writeHead(200, { "Content-Type": "text/html" });
                    fs.readFile('./main.html', (error, data) => {
                        if (error) throw error
                        response.write(data)
                        response.end()
                    })
                    // response.end(`<video src="/video" width="1000" controls="controls"></video>`)

                } else {
                    response.writeHead(200, { "Content-Type": "text/html" });
                    fs.readFile('./error.html', (error, data) => {
                        if (error) throw error
                        response.write(data)
                        response.end()
                    })
                }

            });

        }
        else if (path == "/video") {
            var range = request.headers.range;
            let stats = await stat('./me.mp4')
            var positions = range.replace(/bytes=/, "").split("-");
            var start = parseInt(positions[0], 10);
            var end = positions[1] ? parseInt(positions[1], 10) : start + 1024*1024;
            if(end > stats.size -1) end = stats.size -1
            response.writeHead(206, {
                "Content-Range": "bytes " + start + "-" + end + "/" + stats.size,
                "Accept-Ranges": "bytes",
                "Content-Length": end - start + 1,
                "Content-Type": "video/mp4"
            });
            let movieStream = fs.createReadStream('./me.mp4', {start:start, end:end})
            
            movieStream.pipe(response);
            movieStream.on('end', () => {
                response.end()
            })
        }
    }

    http.createServer(onRequest).listen(80);
}

exports.start = start;
