import axios from 'axios'

const baseurl = `/api/get_signature?ott=`

const getSignature = async (ott) => {
    const response = await axios.get(baseurl + ott);
    return response.data
}

const signService = { getSignature }

export default signService