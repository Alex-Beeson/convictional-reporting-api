const axios = require('axios');

async function consolidateData(startDate, endDate, seller) {
    let dataToSend = {}
    let orders = await orderFetch(startDate, endDate, seller)
    let products = await productFetch(seller)

    dataToSend = {
        dates: dateCreator(startDate, endDate),
        sales: createSalesReport(orders),

    }

    return dataToSend
}

function dateCreator(startDate, endDate) {
    var difference = Math.round((endDate - startDate) / 86400000);
    var dates = {
        startDate: startDate,
        endDate: endDate,
        difference: difference,
        previousStartDate: endDate - difference,
        previousEndDate: startDate
    }

    return dates
}

function orderFetch(startDate, endDate, seller) {
    // Make a request for a user with a given ID
    axios.get('https://api.convictional.com/buyer/orders', {
        headers: {
            'Authorization': process.env.CONVICTIONAL_API_KEY
        }
    })
        .then(function (response) {
            // handle success
            if (seller) {

            } else {
                var filteredOrders = orders.filter(order => {
                    var orderDate = new Date(order.date);
                    return orderDate >= startDate && orderDate <= endDate

                })

                return filteredOrders
            }
        })
        .catch(function (error) {
            // handle error
            console.log(error);
        })

}

function productFetch(seller) {
    // Make a request for a user with a given ID
    axios.get('https://api.convictional.com/buyer/products', {
        headers: {
            'Authorization': process.env.CONVICTIONAL_API_KEY
        }
    })
        .then(function (response) {
            // handle success
            console.log(response);
        })
        .catch(function (error) {
            // handle error
            console.log(error);
        })

}

function createSalesReport(orders, sellers) {
    let salesBreakdown = {
        totalSales = {
            totalSales: '',
            previousTotalSales: '',
            deltaTotalSalesPercent: ''
        },
        netSales = {
            netSales: '',
            previousNetSales: '',
            deltaNetSalesPercent: ''
        },
        topSellers =[

        ],
        sellerTrends =[

        ]
    }




    return salesBreakdown
}


module.exports = { consolidateData }