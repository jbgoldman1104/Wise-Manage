import info from '../../service/consts'
import axios from 'axios'
const baseurl = `${info.SERVER_BASE}/ott?ott=`

export default async function handler(req, res) {
    try{
       const response = await axios.get(baseurl + req.query.ott)
        res.status(200).json(response.data)
    } catch (error) {
        console.error(error)
        return res.status(error.status || 500).end(error.message)
    }
}
