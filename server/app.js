const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const search = require('yt-search');
const { exec } = require('youtube-dl-exec');
const util = require('util');
const os = require('os');
const path = require('path');
const tmp = require('tmp');
const fs = require('fs');
const archiver = require('archiver');
const downloadFolder = path.join(os.homedir(), 'Downloads');
const searchAsync = util.promisify(search);

const app = express();

app.use(cors());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.get('/download', async (req, res) => {
    console.log('hit GET...')

    await downloadZip(res)
    // const { urls } = req.query
    // const songs = urls.split(',')
    // console.log(songs)

    // const links = await getYTLinks(songs)
    // const videos = []
    // for (let i = 0; i < songs.length; ++i) {
    //     videos.push(
    //         {
    //             name: songs[i],
    //             url: links[i],
    //         }
    //     )
    // }

    // await downloadFromYT(videos, res)

    // res.redirect('http://localhost:3000/download/songs')
})

app.post('/download', async (req, res) => {
    console.log('hit POST...')
    const { songs } = req.body

    const links = await getYTLinks(songs)

    for (let i = 0; i < links.length; ++i)
        await downloadFromYT(links[i], songs[i])

    res.send({ success: true, msg: ':)' })
})



// Start the server
app.listen(8888, () => {
    console.log('Server started on http://localhost:8888');
});



async function getYTLinks(songs) {
    const links = []
    for (let song of songs) {
        const link = await searchVideos(song)
        links.push(link)
    }
    return links
}
async function searchVideos(query) {
    try {
        const results = await searchAsync(query);
        const videoUrl = `https://www.youtube.com/watch?v=${results.videos[0].videoId}`;
        return videoUrl;
    } catch (error) {
        console.error(error.response.data);
        // Handle the error
    }
}

async function downloadFromYT(videoUrl, name = '') {
    return new Promise((res) => {
        exec(videoUrl, {
            extractAudio: true,
            audioFormat: 'mp3',
            o: './server/songs/%(title)s.%(ext)s'
        }).then(output => {
            res()
            console.log(`Successfully download and saved ${name}`);
        }).catch(error => {
            res()
            console.log(`Failed to download and save ${name}`);
        });
    })
}

async function sleep(time) { return new Promise(res => setTimeout(res, time)) }

async function downloadZip(res) {
    try {
        // Create a new Archiver instance
        const archive = archiver('zip');

        // Set the name of the output ZIP file
        const zipFileName = 'songs.zip';
        const directoryPath = 'songs'

        // Create a write stream to write the ZIP file to disk
        const output = fs.createWriteStream(path.join(__dirname, zipFileName));

        // Wait for the write stream to be ready
        await new Promise((resolve, reject) => {
            output.on('open', resolve);
            output.on('error', reject);
        });

        // Pipe the output stream to the Archiver instance
        archive.pipe(output);
        console.log(path.join(__dirname, directoryPath))
        // Add the contents of the "songs" directory to the ZIP archive
        archive.directory(path.join(__dirname, directoryPath), false);

        // Finalize the ZIP archive
        await archive.finalize();

        // --- FEATURE - definitely not a bug
        await sleep(0)

        // // res.redirect('http://localhost:3000/download/songs')
        // Send the ZIP file as a response to the client
        res.download(path.join(__dirname, zipFileName), zipFileName, (err) => {
            if (err) {
                console.error('Failed to send ZIP file:', err);
            } else {
                console.log('ZIP file sent successfully');

                // Delete the ZIP file and the "songs" directory from disk
                fs.unlink(path.join(__dirname, zipFileName), (err) => {
                    if (err) {
                        console.error('Failed to delete ZIP file:', err);
                    } else {
                        console.log('ZIP file deleted successfully');

                        fs.readdir(path.join(__dirname, directoryPath), (err, files) => {
                            if (err) {
                                console.error('Failed to read "songs" directory:', err);
                            } else {
                                for (const file of files) {
                                    fs.unlink(path.join(__dirname, directoryPath, file), (err) => {
                                        if (err) {
                                            console.error(`Failed to delete file "${file}" from "songs" directory:`, err);
                                        } else {
                                            console.log(`File "${file}" deleted successfully from "songs" directory`);
                                        }
                                    });
                                }

                                fs.rmdir(path.join(__dirname, directoryPath), (err) => {
                                    if (err) {
                                        console.error('Failed to delete "songs" directory:', err);
                                    } else {
                                        console.log('"songs" directory deleted successfully');
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    } catch (err) {
        console.error('Error occurred while zipping "songs" directory:', err);
        res.status(500).send('Error occurred while zipping "songs" directory');
    }
}

// async function downloadFromYT(videos, res) {
//     const zipFile = tmp.fileSync({ postfix: '.zip' }).name;
//     const output = fs.createWriteStream(zipFile);
//     const archive = archiver('zip', {
//         zlib: { level: 9 } // Maximum compression
//     });

//     output.on('close', () => {
//         console.log(`Successfully zipped ${videos.length} files`);
//         res.download(zipFile, 'songs.zip', err => {
//             if (err) {
//                 console.error('Failed to send zip file to client');
//                 console.error(err);
//                 res.status(500).send('Failed to send zip file to client');
//             } else {
//                 console.log('Sent zip file to client');
//             }
//             // Clean up the temporary files
//             fs.unlinkSync(zipFile);
//             for (const video of videos) {
//                 fs.unlinkSync(video.tmpFile);
//             }
//         });
//     });

//     archive.on('warning', err => {
//         console.warn(err);
//     });

//     archive.on('error', err => {
//         console.error(`Failed to create zip file`);
//         console.error(err);
//         res.status(500).send('Failed to create zip file');
//     });

//     archive.pipe(output);

//     for (const video of videos) {
//         const tmpFile = tmp.fileSync({ postfix: '.mp3' }).name;
//         video.tmpFile = tmpFile; // Store the temporary file path in the video object
//         await exec(video.url, {
//             extractAudio: true,
//             audioFormat: 'mp3',
//             o: tmpFile
//         }).then(() => {
//             console.log(`Successfully downloaded ${video.name}`);
//             archive.file(tmpFile, { name: `${video.name}.mp3` });
//         }).catch(error => {
//             console.error(`Failed to download ${video.name}`);
//             console.error(error);
//             archive.file(tmpFile, { name: `${video.name}.mp3` }); // Add an empty file to the zip file
//         });
//     }

//     archive.finalize();
// }
