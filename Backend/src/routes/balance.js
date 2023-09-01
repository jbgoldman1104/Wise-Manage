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

async function GetBalance() {

    let result = "";

    let totalBalance = {};

    const currentDate = new Date();

    // Get the start time of the specified week
    const startOfWeek = moment(currentDate).add(-90, 'day').startOf('day').toDate().toISOString();
    const startDay = moment(currentDate).add(-90, 'day').format('YYYY-MM-DD');
    // Get the end time of the specified week
    const endOfWeek = moment(currentDate).endOf('day').toDate().toISOString();
    const endDay = moment(currentDate).format('YYYY-MM-DD');

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
                
            const url = API_URL + `v1/profiles/${profileId}/balance-statements/${balanceId}/statement.pdf?currency=${currency}&intervalStart=${startOfWeek}&intervalEnd=${endOfWeek}&type=COMPACT`;

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

                    const command = `printf '${OTT}' | openssl sha256 -sign private.pem | base64 -w 0`;

                    try {
                      const signature = execSync(command);
                      const pdf = await axios.get(url,
                          {
                              responseType: "arraybuffer",
                              responseEncoding: "binary",
                              headers: {
                                  'Authorization': 'Bearer ' + token,
                                  'x-2fa-approval': OTT,
                                  'X-Signature': signature,
                                  "Content-Type": "application/pdf",
                              }
                          }
                      );

                      if ( profileId != 13116178 || balanceId != 10671215 || currency != "GBP" ) {
                        continue;
                      }

                      const destinationPath = `pdf/${profileId}-${balanceId}-${currency}-${startDay}-${endDay}-transactions.pdf`;

                      const base64Str = Buffer.from(pdf.data).toString("base64");

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

    return result;

}

const balanceRouter = express.Router();

// GET a product
balanceRouter.get("/api/balance/pdf", async (req, res) => {

  try {
    const pdfpath = await GetBalance();
    if ( pdfpath ) {
      res.writeHead(200, {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": "attachment; filename=statement.pdf" 
      });
    }
    fs.createReadStream(pdfpath).pipe(res);
    
    return res.send({ status: true, product });

  } catch (error) {
  }
  return res
      .status(401)
      .send({ status: false, type: "Error" });  
});

module.exports = { balanceRouter };
