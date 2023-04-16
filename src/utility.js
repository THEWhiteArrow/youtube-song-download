import axios from 'axios'
const download = async (songs) => {
    console.log(songs)
    const res = await axios.post('http://localhost:8888/download', { songs })
    return res
}



export { download }