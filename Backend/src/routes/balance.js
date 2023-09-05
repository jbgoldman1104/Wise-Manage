const express = require("express");
const { Rate, User } = require("../db");
const fs = require('fs');
const { Product } = require("../db/models/Product");
const { validateReqBody, getErrors, getCommentsFromID } = require("../helpers");
const auth = require("./middlewares/auth");

const axios = require('axios');
const moment = require('moment');
const { exec, execSync } = require('child_process');
const base64topdf = require('base64topdf')

const token1 = 'ad599a5d-5f7f-4335-b8ab-130bcbadef76';
const token2 = 'd3dccc64-50a5-4ee7-b098-2d33ed198a84';
const token = 'ad599a5d-5f7f-4335-b8ab-130bcbadef76';
// const profileId = 'P17073';
const API_URL = 'https://api.transferwise.com/'

async function GetBalance(startDay, endDay, type) {

    let result = undefined;

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
                    // console.log('OTT', OTT);

                    const command = `printf '${OTT}' | openssl sha256 -sign /etc/private.pem | base64 -w 0`;

                    try {
                        const signature = execSync(command).toString();
                        const response = await axios.get(url,
                            {
                                responseType: "arraybuffer",
                                responseEncoding: type == 'pdf' ? "binary" : undefined,
                                headers: {
                                    'Authorization': 'Bearer ' + token,
                                    'x-2fa-approval': OTT,
                                    'X-Signature': signature,
                                    "Content-Type": type == 'pdf' ? "application/pdf" : undefined,
                                }
                            }
                        );

                        if (profileId != 13116178 || balanceId != 10671215 || currency != "GBP") {
                            continue;
                        }

                        if (type == 'json') {
                            return response;
                        }

                        const destinationPath = `pdf/${profileId}-${balanceId}-${currency}-${startDay}-${endDay}-transactions.pdf`;

                        const base64Str = Buffer.from(response.data).toString("base64");

                        //   console.log(base64Str);

                        await base64topdf.base64Decode(
                            base64Str,
                            destinationPath
                        );

                        result = destinationPath;

                    } catch (err) {
                        console.log('transaction history error', err);
                    }
                }
            }
        }

    }

    console.log('totalBalance', totalBalance);
    console.log('PDF', result);

    return result;
}

const balanceRouter = express.Router();

// GET a product
balanceRouter.get("/api/balance", async (req, res) => {

    try {

        const result = await GetBalance(req.query.start, req.query.end, req.query.type);
        if (req.query.type == 'pdf') {
            if (result && result.length > 0) {
                res.writeHead(200, {
                    "Content-Type": "application/octet-stream",
                    "Content-Disposition": "attachment; filename=statement.pdf"
                });
                fs.createReadStream(result).pipe(res);
            }

        }

        if (req.query.type == 'json') {
            res.send({ status: true, result });
        }

        return;

    } catch (error) {
        console.log(error);
    }
    return res
        .status(401)
        .send({ status: false, type: "Error" });
});


balanceRouter.get("/api/ott", async (req, res) => {

    try {

        const OTT = req.query.ott || '';
        const command = `printf '${OTT}' | openssl sha256 -sign /etc/private.pem | base64 -w 0`;
        const signature = execSync(command).toString();
        res.send({ status: true, signature });

        return;

    } catch (error) {
        console.log(error);
    }
    return res
        .status(401)
        .send({ status: false, type: "Error" });
});


module.exports = { balanceRouter };
