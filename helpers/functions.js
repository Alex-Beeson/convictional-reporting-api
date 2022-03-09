const axios = require('axios');

// This is the asynchronous function called from the API middleware
// It gathers all data into a single payload
async function consolidateData(startDate, endDate, seller) {
    let dataToSend = {}
    let orders = await orderFetch(startDate, endDate, seller)
    let products = await productFetch(seller)
    let sellers = await partnerFetch()

    dataToSend = {
        dates: dateCreator(startDate, endDate),
        orderList: orders,
        salesReport: createSalesReport(orders),
        productReport: createProductReport(products, orders, sellers),

    }

    return dataToSend
}

// Create an object of key date values
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
// BEGIN DATA FETCHING FROM CONVICTIONAL
// Get the orders from Convictional account
function orderFetch(startDate, endDate, seller) {
    // Make a request for a user with a given ID
    axios.get('https://api.convictional.com/orders', {
        headers: {
            'Authorization': process.env.CONVICTIONAL_API_KEY
        }
    })
        .then(function (response) {
            // handle success
            var orders = response.data;
            // First filter the orders by the supplied date range
            var dateFilteredOrders = orders.filter(order => {
                var orderDate = new Date(order.date);
                return orderDate >= startDate && orderDate <= endDate
            })
            // Then if a seller was supplied, filter the orders by that sellers' orders
            if (seller != null) {

                var sellerFilteredOrders = dateFilteredOrders.filter(order => {
                    var orderSeller = order.sellerId;
                    return seller == orderSeller
                })
                return sellerFilteredOrders
            } else {


                return dateFilteredOrders
            }
        })
        .catch(function (error) {
            // handle error
            console.log(error);
        })

}

//Get all the products from Convictional
function productFetch(seller) {
    // Make a request for a user with a given ID
    axios.get('https://api.convictional.com/products', {
        headers: {
            'Authorization': process.env.CONVICTIONAL_API_KEY
        }
    })
        .then(function (response) {
            // handle success
            var products = response.data;

            // If a seller was supplied, filter the products by those from that seller
            if (seller != null) {
                var filteredProducts = products.filter(product => {
                    var productSeller = product.companyId
                    return seller == productSeller
                })
                return filteredProducts
            } else {
                return products
            }
        })
        .catch(function (error) {
            // handle error
            console.log(error);
        })
}

function partnerFetch() {
    // Make a request for a user with a given ID
    axios.get('https://api.convictional.com/partners', {
        headers: {
            'Authorization': process.env.CONVICTIONAL_API_KEY
        }
    })
        .then(function (response) {
            // handle success
            var partners = response.data;
            return partners
        })
        .catch(function (error) {
            // handle error
            console.log(error);
        })
}

// END CONVICTIONAL DATA FETCHING

// BEGIN REPORT CREATION

// Organize all of the Sales values
function createSalesReport(orders, sellers) {
    let salesBreakdown = {
        totalSales: {
            totalSales: '',
            previousTotalSales: '',
            deltaTotalSalesPercent: ''
        },
        netSales: {
            netSales: '',
            previousNetSales: '',
            deltaNetSalesPercent: ''
        },
        topSellers: [

        ],
        sellerTrends: [

        ]
    }

    return salesBreakdown
}

// Organize All of the Product Values
function createProductReport(products, orders, sellers) {
    let productBreakdown = {
        products: [

        ],
    }

    let productModel = {
        title: '',
        SKU: '',
        vendor: '',
        margin: '',
        orders: '',
        salesVolume: '',
        profit: '',
        previousOrders: '',
        previousSalesVolume: '',
        trendOrders: '',
        trendSalesVolume: '',
    }

    return productBreakdown
}


// Organize All of the Operations Values


// Organize all of the Finance Values


// Organize All of the Inventory Values


// MATH
// Sum Array
function sumArray(array) {
    let sum = 0;
    array.forEach(element => {
        sum += element
    });
    return sum
}

// Percentage Difference
function percentDifference(current, previous) {
    var delta = current - previous;
    let result = 0;
    if (delta < 0) {
        result = +0-(100-(previous/current)).toFixed(2)
      } else {
        result = +(current/previous).toFixed(2)
      }
      return result
}

module.exports = { consolidateData }