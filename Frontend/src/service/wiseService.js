import axios from 'axios'

const getBalance = async (startDay, endDay, type) => {
    try {
        const response = await axios.get(`/api/get_balance?startDay=${startDay}&&endDay=${endDay}&&type=${type}`);   
        if ( type == 'json') {
            return response.data;
        }

        const bytes = new Uint8Array(response.data.data, 0, response.data.data.length);
        return type == 'json' ? response.data : new Blob([bytes]);
    } catch (error ) {
        console.log(error);
    }

    return false;
}

const wiseService = { getBalance }

export default wiseService