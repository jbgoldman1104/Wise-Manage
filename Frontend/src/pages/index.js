import { useState, useEffect } from 'react'
import Head from 'next/head';
import { subDays, subHours } from 'date-fns';
import { Box, Button, Container, Unstable_Grid2 as Grid } from '@mui/material';
import { Layout as DashboardLayout } from 'src/layouts/dashboard/layout';
import { OverviewBudget } from 'src/sections/overview/overview-budget';
import { OverviewLatestOrders } from 'src/sections/overview/overview-latest-orders';
import { OverviewLatestProducts } from 'src/sections/overview/overview-latest-products';
import { OverviewSales } from 'src/sections/overview/overview-sales';
import { OverviewTasksProgress } from 'src/sections/overview/overview-tasks-progress';
import { OverviewTotalCustomers } from 'src/sections/overview/overview-total-customers';
import { OverviewTotalProfit } from 'src/sections/overview/overview-total-profit';
import { OverviewTraffic } from 'src/sections/overview/overview-traffic';
import signService from 'src/service/signService';
import wiseService from 'src/service/wiseService';
// import { DateRangePicker } from '@mui/x-date-pickers-pro';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const moment = require('moment');

const now = new Date();

const Page = () => {

  const [orders, setOrders] = useState([]);

  const handleDownload = (type) => async () => {
    // const result = await axios.get(
    //   "http://94.131.99.105:4000/api/balance/token"
    // )
    // window.open("http://94.131.99.105:4000/api/balance/pdf");

    const startOfWeek = moment().add(-7, 'day').startOf('day').toDate().toISOString();
    const endOfWeek = moment().endOf('day').toDate().toISOString();

    const response = await wiseService.getBalance(startOfWeek, endOfWeek, type);

    if ( type == 'pdf' ) {
      // create file link in browser's memory
      const href = URL.createObjectURL(response);

      // create "a" HTML element with href to file & click
      const link = document.createElement('a');
      link.href = href;
      link.setAttribute('download', 'statement.pdf'); //or any other extension
      document.body.appendChild(link);
      link.click();

      // clean up "a" element & remove ObjectURL
      document.body.removeChild(link);
      URL.revokeObjectURL(href);

    } else {
      try {
        const orders = [];
        response.transactions.forEach((item)=>{
          if ( item.amount.value > 0 ) {
            orders.push({
              id: item.referenceNumber,
              from: item.details?.senderName,
              amount: '£' + Number(item.amount.value).toLocaleString('en', {
                minimumFractionDigits: 2
              }),
              description:  item.details ? item.details.description : item.exchangeDetails.description,
              date: moment(item.date).format('DD-MM-YYYY'),
            });
          }
        });
        setOrders(orders);
      } catch (error) {
        console.log(error);
      }


    }

  }

  return (
    <>
      <Head>
        <title>
          Overview 
        </title>
      </Head>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 8
        }}
      >
        <Container maxWidth="xl">
          <Grid container>
            {/* <DatePicker label="test" /> */}
            <Button 
                  onClick={handleDownload('json')}>
              Reload Table
            </Button>
            {/* <Button variant="contained"
                  onClick={handleDownload('pdf')}>
              Download PDF
            </Button> */}
          </Grid>
          <Grid
            container
            spacing={3}
            mt={1}
          >
            <Grid
              xs={12}
            >
              <OverviewLatestOrders
                orders={orders}
                sx={{ height: '100%' }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>
    </>
  );
};

Page.getLayout = (page) => (
  <DashboardLayout>
    {page}
  </DashboardLayout>
);

export default Page;
