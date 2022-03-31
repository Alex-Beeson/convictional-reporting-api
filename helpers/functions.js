const axios = require('axios');
//CALLOUT CURRENCY NOT ACCOMMODATED YET


// This is the asynchronous function called from the API middleware
// It gathers all data into a single payload
async function consolidateData(startDate, endDate, seller) {
    
        let dataToSend = {}
        const fetchedOrders = await orderFetch(startDate, endDate, seller)
        const fetchedProducts = await productFetch(seller)
        const fetchedSellers = await partnerFetch()
    
        // Console Logs to check API Responses
    // console.log(`Start Date: ${startDate}, End Date: ${endDate}, Seller: ${seller}`);
    // console.log(`Fetched ${fetchedOrders.currentOrders.length} Current Orders`);
    // console.log(`Fetched ${fetchedOrders.previousOrders.length} Previous Orders`);
    // console.log(`Fetched ${fetchedProducts.length} Products`)
    // console.log(`Fetched ${fetchedSellers.length} Sellers`)

    // Each key in the response payload makes a function call to gather the necessary data
        dataToSend = {
            //salesReport: await createSalesReport(fetchedOrders),
            //sellerReport: await createSellerReport(fetchedOrders, fetchedSellers, fetchedProducts),
            productReport: await createProductReport(fetchedProducts, fetchedOrders, startDate, endDate),
            // operations
            // finance
            // inventoryReport:
        }
    return dataToSend
}

// Create an object of key date values
function dateCreator(startDate, endDate) {
    var difference = Math.round(new Date(endDate) - new Date(startDate));
    var dates = {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        difference: difference,
        daysDifference: difference / 86400000,
        previousStartDate: new Date(new Date(startDate) - difference),
        previousEndDate: new Date(startDate)
    }
    return dates
}
// BEGIN DATA FETCHING FROM CONVICTIONAL
// Get the orders from Convictional account
async function orderFetch(startDate, endDate, seller) {
    // Create an object of important dates
    var dates = dateCreator(startDate, endDate)

    // Make a request for all orders
    return axios.get('https://api.convictional.com/orders?page=0&limit=250', {
        headers: {
            'Authorization': process.env.CONVICTIONAL_API_KEY
        }
    })
        .then(function (response) {
            // handle success
            var orders = response.data;
            var sortedOrders = {
                currentOrders: [],
                previousOrders: []
            }
            // First filter the orders by the supplied date range
            var dateFilteredOrders = orders.filter(order => {
                var orderDate = new Date(order.date);

                return orderDate.getTime() >= dates.startDate.getTime() && orderDate.getTime() <= dates.endDate.getTime()
            })
            var previousFilteredOrders = orders.filter(order => {
                var orderDate = new Date(order.date);

                return orderDate.getTime() >= dates.previousStartDate.getTime() && orderDate.getTime() <= dates.previousEndDate.getTime()
            })
            sortedOrders = {
                currentOrders: dateFilteredOrders,
                previousOrders: previousFilteredOrders
            }

            // Then if a seller was supplied, filter the orders by that sellers' orders
            if (seller != 'null') {
                var sellerSortedOrders = {
                    currentOrders: [],
                    previousOrders: []
                }

                var sellerFilteredOrders = dateFilteredOrders.filter(order => {
                    var orderSeller = order.sellerCompanyId;
                    return seller == orderSeller
                })
                var sellerPreviousFilteredOrders = previousFilteredOrders.filter(order => {
                    var orderSeller = order.sellerCompanyId;
                    return seller == orderSeller
                })
                sellerSortedOrders = {
                    currentOrders: sellerFilteredOrders,
                    previousOrders: sellerPreviousFilteredOrders
                }
                // console.log(`Fetched ${sellerSortedOrders.currentOrders.length} Seller Sorted Orders`);
                return sellerSortedOrders
            } else {
                // console.log(`Fetched ${sortedOrders.currentOrders.length} Sorted Orders`);
                return sortedOrders
            }
        })
        .catch(function (error) {
            // handle error
            console.log(error);
        })
}

//Get all the products from Convictional
async function productFetch(seller) {
    // Make a request for a user with a given ID
    return axios.get('https://api.convictional.com/products?page=0&limit=250', {
        headers: {
            'Authorization': process.env.CONVICTIONAL_API_KEY
        }
    })
        .then(function (response) {
            // handle success
            var products = response.data;

            // If a seller was supplied, filter the products by those from that seller
            if (seller != 'null') {
                var filteredProducts = products.filter(product => {
                    var productSeller = product.companyId
                    return productSeller == seller
                })
                // console.log(`Fetched ${filteredProducts.length} Filtered Products`);
                return filteredProducts
            } else {
                // console.log(`Fetched ${products.length} Products`);
                return products
            }
        })
        .catch(function (error) {
            // handle error
            console.log(error);
        })
}

async function partnerFetch() {
    // Make a request for a user with a given ID
    return axios.get('https://api.convictional.com/partners', {
        headers: {
            'Authorization': process.env.CONVICTIONAL_API_KEY
        }
    })
        .then(function (response) {
            // handle success
            var partners = response.data.data;
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
async function createSalesReport(orders) {
    let orderValues = orders.currentOrders.map(x => x.totalRetailPrice)
    let previousOrderValues = orders.previousOrders.map(x => x.totalRetailPrice)


    let profitValues = orders.currentOrders.map(x => x.totalRetailPrice - x.totalPrice)
    let previousProfitValues = orders.previousOrders.map(x => x.totalRetailPrice - x.totalPrice)

    let salesBreakdown = {
        totalSales: {
            totalSales: sumArray(orderValues),
            previousTotalSales: sumArray(previousOrderValues),
            deltaTotalSalesPercent: percentDifference(sumArray(orderValues), sumArray(previousOrderValues))
        },
        // DELETE SAMPLE DATA WHEN NET IS AVAILABLE
        netSales: {
            netSales: 1000,
            previousNetSales: 650,
            deltaNetSalesPercent: percentDifference(1000, 650)
        },
        profit: {
            profit: sumArray(profitValues),
            previousProfit: sumArray(previousProfitValues),
            deltaProfitPercent: percentDifference(sumArray(profitValues), sumArray(previousProfitValues))
        }
    }
    return salesBreakdown
}

// Organize All of the Seller Values
async function createSellerReport(orders, sellers, products) {

    let sellerBreakdown = sellers.map(seller => {

        // Filter the Current and Previous supplied Orders by the Seller
        let sellerCurrentOrderFilter = orders.currentOrders.filter(order => {
            return order.sellerCompanyId == seller.sellerCompanyId
        })

        let sellerPreviousOrderFilter = orders.previousOrders.filter(order => {
            return order.sellerCompanyId == seller.sellerCompanyId
        })

        // Extract the Sellers Variants to Run Margin Analysis
        let sellerVariantArray = []
        let sellerProductFilter = products.filter(product => {
            return product.companyId == seller.sellerCompanyId
        })
        sellerProductFilter.forEach(product => {
            product.variants.forEach(variant => {
                sellerVariantArray.push(variant)
            })
        })

        // Run Margin Analysis
        function calcAvgProductMargin() {
            let variantMargins = sellerVariantArray.map(variant => {
                return variant.retailPrice - variant.basePrice
            })

            let summedVariantMargins = sumArray(variantMargins)

            return summedVariantMargins / variantMargins.length
        }

        function calcAvgProductMarginPercent() {
            let variantMargins = sellerVariantArray.map(variant => {
                return 100 * (variant.retailPrice - variant.basePrice) / variant.retailPrice
            })

            let summedVariantMargins = sumArray(variantMargins)

            return summedVariantMargins / variantMargins.length
        }

        // Run Sales Volume Analysis
        function calcSalesVolume(array) {
            let salesValues = array.map(e => {
                return e.totalRetailPrice
            })
            return sumArray(salesValues)
        }

        // Run Profit Analysis
        function calcProfit(array) {
            let profitValues = array.map(e => {
                return e.totalRetailPrice - e.totalPrice
            })
            return sumArray(profitValues)
        }


        // Collate the Seller Statistics into a single response
        return (
            {
                sellerName: seller.sellerName,
                sellerId: seller.sellerCompanyId,
                averageShipTime: seller.averageShipTime,
                averageReturnRate: seller.averageReturnRate,
                numberOfProducts: sellerProductFilter.length,
                averageProductMargin: calcAvgProductMargin(),
                averageProductMarginPercent: calcAvgProductMarginPercent(),
                orders: sellerCurrentOrderFilter.length,
                salesVolume: calcSalesVolume(sellerCurrentOrderFilter),
                profit: calcProfit(sellerCurrentOrderFilter),
                previousOrders: sellerPreviousOrderFilter.length,
                previousSalesVolume: calcSalesVolume(sellerPreviousOrderFilter),
                previousProfit: calcProfit(sellerPreviousOrderFilter),
                trendOrders: percentDifference(sellerCurrentOrderFilter.length, sellerPreviousOrderFilter.length),
                trendSalesVolume: percentDifference(calcSalesVolume(sellerCurrentOrderFilter), calcSalesVolume(sellerPreviousOrderFilter)),
                trendProfit: percentDifference(calcProfit(sellerCurrentOrderFilter), calcProfit(sellerPreviousOrderFilter)),
            }
        )
    })

    return sellerBreakdown
}

// Organize All of the Product Values
async function createProductReport(products, orders, startDate, endDate) {
    var dates = dateCreator(startDate, endDate)

    // Break Product into Variants
    let variantsList = [];
    products.forEach(product => {
        product.variants.forEach(variant => {
            let variantObject = {
                title: `${product.title} | ${variant.title}`,
                sellerVariantId: variant.id,
                productCode: product.code,
                vendor: product.vendor,
                companyId: product.companyId,
                partnerPrice: variant.partnerPrice,
                basePrice: variant.basePrice,
                unitMargin: variant.partnerPrice - variant.basePrice,
                inventoryQuantity: variant.inventory_quantity,
                orders: 0,
                quantitySold: 0,
                salesVolume: 0,
                profit: 0,
                previousOrders: 0,
                previousQuantitySold: 0,
                previousSalesVolume: 0,
                previousProfit: 0,
            }
            variantsList.push(variantObject)
        })
    })

    // Cycle through Order Line Items, Adding values to the Variant Listings
    orders.currentOrders.forEach(order => {
        order.items.forEach(item => {
            variantsList.forEach(variant => {
                if (item.sellerVariantCode == variant.sellerVariantId) {
                    variant.orders += 1
                    variant.quantitySold += item.quantity
                    variant.salesVolume += item.extendedRetailPrice
                    variant.profit += (item.extendedRetailPrice - item.extendedPrice)
                }
            })
        })
    })

    orders.previousOrders.forEach(order => {
        order.items.forEach(item => {
            variantsList.forEach(variant => {
                if (item.buyerVariantCode == variant.code) {
                    variant.previousOrders += 1
                    variant.previousQuantitySold += item.quantity
                    variant.previousSalesVolume += item.extendedRetailPrice
                    variant.previousProfit += (item.extendedRetailPrice - item.extendedPrice)
                }
            })
        })
    })

    function assessProductGrade(id) {
        let orderValues = orders.currentOrders.map(x => x.totalRetailPrice)
        let totalCompanySales = Math.round(sumArray(orderValues)*100) / 100;
        
        variantsList.sort(function (a, b) {
            return b.salesVolume - a.salesVolume 
        });
        const a = Math.round(.8 * totalCompanySales) * 100 / 100;
        const b = a + Math.round(.15 * totalCompanySales) * 100 / 100;
        const c = b + Math.round(.05 * totalCompanySales) * 100 / 100;
        console.log(a)
        console.log(b)
        console.log(c)
        
        var indexOf = variantsList.findIndex(variant => {
            return variant.sellerVariantId === id;
        })
        console.log(indexOf)
        
        let valueToTest = 0;
        
        for (let i = 0; i < indexOf; i++) {

            valueToTest += variantsList[i].salesVolume
        }
        
        console.log("Resulting Test Value " + valueToTest)

        if (valueToTest <= a) {
            return "A"
        } else if ((valueToTest > a) && (valueToTest <= b)) {
            return "B"
        } else if (valueToTest > b) {
             return "C"
        }
    }

    // Add the final analysis for trends and Inventory Analysis
    let productBreakdown = variantsList.map(variant => {
        return (
            {
                ...variant,
                trendOrders: percentDifference(variant.orders,variant.previousOrders),
                trendQuantitySold: percentDifference(variant.quantitySold,variant.previousQuantitySold),
                trendSalesVolume: percentDifference(variant.salesVolume,variant.previousSalesVolume),
                trendProfit: percentDifference(variant.profit,variant.previousProfit),
                averageDailySales: variant.quantitySold / dates.daysDifference,
                daysOfInventoryRemaining: variant.inventoryQuantity / (variant.quantitySold / dates.daysDifference),
                abcAnalysis: assessProductGrade(variant.sellerVariantId),
                totalValueOfInventoryPrice: variant.inventoryQuantity * variant.partnerPrice,
                totalValueOfInventoryCost: variant.inventoryQuantity * variant.basePrice,
                sellThroughRate: (variant.quantitySold / variant.inventoryQuantity)*100
            }
        )
    })
    return productBreakdown
}


// Organize All of the Operations Values


// Organize all of the Finance Values





//END REPORT ORGANIZATION

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
        result = +0 - (100 - (previous / current)).toFixed(2)
    } else {
        result = +(current / previous).toFixed(2)
    }
    return result
}

module.exports = { consolidateData }