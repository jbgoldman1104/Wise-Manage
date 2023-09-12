import axios from 'axios'
import signService from '../../service/signService'

const token = 'ad599a5d-5f7f-4335-b8ab-130bcbadef76';
// const profileId = 'P17073';
const API_URL = 'https://api.transferwise.com/'

import info from '../../service/consts'
const baseurl = `${info.SERVER_BASE}/ott?ott=`

const getBalance = async (startDay, endDay, type) => {
    
    let totalBalance = {};

    const profileResult = await axios.get(API_URL + 'v2/profiles',
        {
            headers: {
                Authorization: 'Bearer ' + token
            }
        }
    );

    const profiles = profileResult.data || [];
    
    for (let i = 0; i < profiles.length; i++) {

        const profile = profiles[i];

        const profileId = profile.id;

        const balanceResult = await axios.get(API_URL + `v4/profiles/${profileId}/balances?types=STANDARD`,
            {
                headers: {
                    Authorization: 'Bearer ' + token
                }
            }
        );

        const balances = balanceResult.data || [];

        for (let i = 0; i < balances.length; i++) {

            const balance = balances[i];
            const balanceId = balance.id;
            const currency = balance.currency;

            if (profileId != 13116178 || balanceId != 10671215 || currency != "GBP") {
                continue;
            }

            if (!totalBalance[currency]) totalBalance[currency] = balance.amount.value;
            else totalBalance[currency] += balance.amount.value;

            const url = API_URL + `v1/profiles/${profileId}/balance-statements/${balanceId}/statement.${type}?currency=${currency}&intervalStart=${startDay}&intervalEnd=${endDay}&type=COMPACT`;
            console.log(url);

            try {
                await axios.get(url,
                    {
                        headers: {
                            Authorization: 'Bearer ' + token
                        }
                    }
                );
                
            } catch (error) {
                
                const pendingHistoryResult = error.response;
                
                if (pendingHistoryResult?.headers['x-2fa-approval-result'] == 'REJECTED') {

                    const OTT = pendingHistoryResult?.headers['x-2fa-approval'] || '';

                    // const {status, signature} = await signService.getSignature(OTT);
                    const response = await axios.get(baseurl + OTT);
                    console.log("Response = " , response.data.status);
                    
                    if (!response.data.status) {
                        continue;
                    }

                    const signature = response.data.signature;

                    console.log("OTT = ", OTT);
                    console.log("signature = ", signature);
                    
                    try {
                        
                        const response = await axios.get(url,
                            {
                                responseType:  type == 'pdf' ? "arraybuffer" : 'json',
                                responseEncoding: type == 'pdf' ? "binary" : undefined,
                                headers: {
                                    'Authorization': 'Bearer ' + token,
                                    'x-2fa-approval': OTT,
                                    'X-Signature': signature,
                                    "Content-Type": type == 'pdf' ? "application/pdf" : "application/json",
                                }
                            }
                        );

                        

                        return response.data;

                    } catch (err) {
                        console.log('transaction history error', err);
                        return;
                    }
                }
            }
        }

    }
    
}

export default async function handler(req, res) {
    try{
       const response = await getBalance(req.query.startDay, req.query.endDay, req.query.type);
       if ( response === false ) {
            return res.status(500).end("WiseApi Error")
       } else {
            res.status(200).json(response)
       }
    } catch (error) {
        console.error(error)
        return res.status(error.status || 500).end(error.message)
    }
}
