const isEmpty = require("lodash.isempty");
const Razorpay = require("razorpay");
const db = require("../../DB/config");
const { where } = require("sequelize");
const { getTotalBasePrice, getGstTax, getTotalSellPrice } = require("../Helper/PriceCalculation");
const ErrorNullResponse = require("../Helper/ErrorNullResponse");
const crypto = require('crypto');


const Order = db.order;
const Cart = db.cart;
const Address = db.address;
const Product = db.product;
const Setting = db.setting;
const OrderDetail = db.orderDetail;

const generateOrder = async (req, res, next) => {
    try {
        const { amount, paymentMode, selectedAddressId, buyNowMode, buyNowItem } = req.body;
        const user = req.user;
        
        // Convert buyNowMode to boolean for consistent checks
        const isBuyNowMode = buyNowMode === true || 
                             buyNowMode === "true" || 
                             buyNowMode === 1 || 
                             buyNowMode === "1";
        
        console.log("Generate Order - Buy Now Mode:", isBuyNowMode);
        
        if (isEmpty(amount)) {
            res.status(300).send({
                status: 300,
                message: "Failed! Amount is not found"
            })
        } else if (!user) {
            res.status(300).send({
                status: 300,
                message: "Failed! You have not authorized"
            })
        } else {
            // Check if user has any address at all
            const checkAnyAddress = await Address.findOne({ where: { userId: user.userId } });
            if (!checkAnyAddress) {
                return res.status(400).json({
                    status: 400,
                    message: "Failed! Address is not found"
                })
            }

            let instance = new Razorpay({
                key_id: process.env.RAZOR_PAY_KEY_ID,
                key_secret: process.env.RAZOR_PAY_KEY_SECRET,
            });

            // Check for selected address OR default address
            let checkAddress;
            if (selectedAddressId) {
                checkAddress = await Address.findOne({ 
                    where: { 
                        userId: user.userId, 
                        id: selectedAddressId 
                    } 
                });
            } else {
                checkAddress = await Address.findOne({ 
                    where: { 
                        userId: user.userId, 
                        defautAddress: "true" 
                    } 
                });
            }

            if (checkAddress) {
                // Handle Buy Now Mode or Regular Cart
                let checkCart;
                if (isBuyNowMode && buyNowItem) {
                    // Create temporary cart array with single buy now item
                    checkCart = [buyNowItem];
                    console.log("Using buy now item:", buyNowItem);
                } else {
                    // Use regular cart
                    checkCart = await Cart.findAll({ where: { userSlug: user.slug } });
                    console.log("Using regular cart, items count:", checkCart.length);
                }

                const checkProduct = await Product.findAll();
                
                if (checkCart.length !== 0) {
                    const orderCount = await Order.findAll();
                    const settingInfo = await Setting.findAll();

                    // Calculate prices based on cart items
                    let totalBasePrice, totalTaxes, totalAmount;
                    
                    if (isBuyNowMode && buyNowItem) {
                        // Calculate for single buy now item
                        totalBasePrice = parseInt(buyNowItem.basePrice || buyNowItem.cartSellPrice);
                        totalAmount = parseInt(buyNowItem.cartItemtotalSellPrice);
                        totalTaxes = totalAmount - totalBasePrice;
                    } else {
                        // Calculate for regular cart
                        totalBasePrice = await getTotalBasePrice(checkCart, checkProduct);
                        totalTaxes = await getGstTax(checkCart, checkProduct);
                        totalAmount = await getTotalSellPrice(checkCart, checkProduct);
                    }

                    const option = {
                        amount: parseInt(amount) * 100,
                        currency: "INR",
                        receipt: `recipt#${orderCount.length + 1}`,
                        payment_capture: 1,
                        partial_payment: false,
                        notes: {
                            key_id: process.env.RAZOR_PAY_KEY_ID,
                            key_secret: process.env.RAZOR_PAY_KEY_SECRET,
                            name: settingInfo.length !== 0 ? settingInfo[0].app_name : "",
                            description: "Online Transaction from IoTtech Smart Product",
                            image: settingInfo.length !== 0 ? settingInfo[0].app_logo : "",
                            address: settingInfo.length !== 0 ? settingInfo[0].app_address : "",
                            themeColor: "#a6c76c",
                            userName: checkAddress.name,
                            userEmail: checkAddress.email,
                            userContact: checkAddress.contact
                        }
                    }

                    const generateNewOrder = await instance.orders.create(option);
                    if (generateNewOrder) {
                        const info = {
                            orderNumber: generateNewOrder.id,
                            userSlug: user.slug,
                            name: checkAddress.name,
                            contact: checkAddress.contact,
                            email: checkAddress.email,
                            address1: checkAddress.address1,
                            address2: checkAddress.address2,
                            pincode: checkAddress.pincode,
                            city: checkAddress.city,
                            state: checkAddress.state,
                            country: checkAddress.country,
                            transactionId: "",
                            paymentMode: paymentMode,
                            totalProduct: checkCart.length,
                            shipping: "200",
                            allTaxes: totalTaxes,
                            totalBasePrice: totalBasePrice,
                            totalAmount: totalAmount,
                            totalDueAmount: totalAmount
                        }

                        const createOrder = await Order.create(info);
                        if (createOrder) {
                            const productList = await Product.findAll();
                            
                            // Create order details
                            const createOrderDetail = checkCart?.map((item, index) => {
                                let productInfo;
                                
                                if (isBuyNowMode && buyNowItem) {
                                    // For buy now, use buyNowItem data
                                    const checkProduct = productList.filter((currElem) => 
                                        currElem.id === item.productId || currElem.slug === item.productSlug
                                    );
                                    
                                    if (checkProduct.length !== 0) {
                                        productInfo = {
                                            orderNumber: generateNewOrder.id,
                                            productId: item.productId,
                                            productName: item.cartProductName,
                                            price: item.cartSellPrice,
                                            specialPrice: item.cartSellPrice,
                                            productCount: item.cartCount,
                                            productTotalPrice: item.cartItemtotalSellPrice
                                        };
                                    }
                                } else {
                                    // For regular cart
                                    const checkProduct = productList.filter((currElem) => 
                                        currElem.slug === item.productSlug
                                    );
                                    
                                    if (checkProduct.length !== 0) {
                                        productInfo = {
                                            orderNumber: generateNewOrder.id,
                                            productId: checkProduct[0]?.id,
                                            productName: checkProduct[0]?.name,
                                            price: checkProduct[0]?.productPrice,
                                            specialPrice: checkProduct[0]?.productSpecialPrice,
                                            productCount: item.cartCount,
                                            productTotalPrice: parseInt(item.cartCount) * parseInt(checkProduct[0].productSpecialPrice)
                                        };
                                    }
                                }
                                
                                return productInfo ? OrderDetail.create(productInfo) : null;
                            });
                            
                            // Clear cart only if COD payment AND NOT buy now mode
                            if (paymentMode === "0" && !isBuyNowMode) {
                                await Cart.destroy({ where: { userSlug: user.slug } });
                                console.log("Cart cleared after COD order");
                            } else {
                                console.log("Cart not cleared - either online payment or buy now mode");
                            }
                            
                            await Promise.all(createOrderDetail.filter(item => item !== null))
                                .then((result) => {
                                    res.status(200).json({
                                        status: 200,
                                        message: "Order Created Successfully",
                                        info: generateNewOrder
                                    })
                                })
                                .catch((error) => {
                                    res.status(300).json({
                                        status: 300,
                                        message: "Failed! Order is not created",
                                        info: error
                                    })
                                })
                        } else {
                            res.status(300).send({
                                status: 300,
                                message: "Failed! Order not created"
                            })
                        }
                    } else {
                        return res.status(300).send({
                            status: 300,
                            message: "Failed! Order unsuccessful",
                        })
                    }
                } else {
                    return res.status(400).json({
                        status: 400,
                        message: "Failed! Product not found, Please add item to cart to purchase"
                    })
                }
            } else {
                return res.status(400).json({
                    status: 400,
                    message: "Failed! No address found. Please select an address."
                })
            }
        }
    } catch (error) {
        return res.status(500).json({
            status: 500,
            error: true,
            message: error.message || error
        })
    }
}


const getOrder = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(300).json({
                status: 300,
                message: "Failed! You have nt authorized person"
            })
        } else {
            const checkOrder = await Order.findAll({ where: { userSlug: user.slug } });
            if (checkOrder.length !== 0) {
                return res.status(200).json({
                    status: 200,
                    message: "Order data fetch successfully",
                    info: checkOrder
                })
            } else {
                return res.status(400).json({
                    status: 400,
                    message: "Failed No Order found"
                })
            }
        }
    } catch (error) {
        return res.status(500).json({
            status: 500,
            error: true,
            message: error.message || error
        })
    }
    next();
}

const getAdminOrder = async (req, res, next) => {
    try {
        const admin = req.admin;
        if (!admin) {
            res.status(300).send({
                status: 300,
                message: "Failed! You have not authorized"
            })
        } else {
            const checkOrder = await Order.findAll();
            if (checkOrder.length !== 0) {
                return res.status(200).json({
                    status: 200,
                    message: "Order list fetch successfully",
                    info: checkOrder
                })
            } else {
                return res.status(400).json({
                    status: 400,
                    message: "Failed! Order not found"
                })
            }
        }
    } catch (error) {
        return res.status(500).json({
            status: 500,
            error: true,
            message: error.message || error
        })
    }
    next();
}

// Backend controller update for verifyPayment
const verifyPayemnt = async (req, res, next) => {
    try {
        const { orderId, paymentId, rPaySignature, buyNowMode } = req.body;
        const errorNullResponse = await ErrorNullResponse({orderId, paymentId, rPaySignature});
        const user = req.user;
        
        if (!user) {
            res.status(300).send({
                status: 300,
                message: "Failed! You have not authorized"
            })
        } else if (errorNullResponse.length !== 0) {
            res.status(300).send({
                status: 300,
                message: errorNullResponse
            })
        } else {
            let hmac = crypto.createHmac('sha256', process.env.RAZOR_PAY_KEY_SECRET);
            hmac.update(orderId + "|" + paymentId);
            const generated_signature = hmac.digest('hex');

            if (generated_signature == rPaySignature) {
                const info = {
                    transactionId: paymentId,
                    transactionSignature: rPaySignature,
                    transactionStatus: "Success",
                    amountDue: ""
                }
                
                // FIXED: Proper check for buy now mode
                // Convert to string for comparison or check for truthy values
                const isBuyNowMode = buyNowMode === true || 
                                     buyNowMode === "true" || 
                                     buyNowMode === 1 || 
                                     buyNowMode === "1";
                
                // Only clear cart if NOT in buy now mode
                if (!isBuyNowMode) {
                    await Cart.destroy({ where: { userSlug: user.slug } });
                    console.log("Cart cleared after payment verification");
                } else {
                    console.log("Buy now mode - cart not cleared");
                }

                await Order.update(info, { where: { orderNumber: orderId } })
                    .then((result) => {
                        res.status(200).json({
                            status: 200,
                            message: "Payment Successful",
                            info: result
                        })
                    })
                    .catch((error) => {
                        res.status(300).json({
                            status: 300,
                            message: "Failed! Something Went Wrong",
                            info: error
                        })
                    })
            } else {
                res.status(300).json({
                    status: 300,
                    message: "Payment verification failed"
                })
            }
        }
    } catch (error) {
        return res.status(500).json({
            status: 500,
            error: true,
            message: error.message || error
        })
    }
    next();
}

const changeOrderStatus = async (req, res, next) => {
    try {
        const admin = req.admin;
        const { orderId, orderNumber, status } = req.body;
        const errorResponse = await ErrorNullResponse(req.body);
        if (!admin) {
            res.status(300).send({
                status: 300,
                message: "Failed! You have not authorized"
            })
        } else if (errorResponse.length !== 0) {
            return res.state(300).json({
                status: 300,
                message: errorResponse
            })
        } else {
            const checkOrder = await Order.findOne({ where: { id: orderId, orderNumber: orderNumber } });
            if (checkOrder) {
                await Order.update({ status: status }, { where: { id: orderId, orderNumber: orderNumber } })
                    .then((result) => {
                        res.status(200).json({
                            status: 200,
                            message: "Order Status change successfull",
                            info: result

                        })
                    })
                    .catch((error) => {
                        res.status(300).json({
                            status: 300,
                            message: "Faild! Order not updated",
                            info: error
                        })
                    })
            } else {
                return res.state(400).json({
                    status: 400,
                    message: "Failed! Order not exist"
                })
            }
        }
    } catch (error) {
        return res.status(500).json({
            status: 500,
            error: true,
            message: error.message || error
        })
    }
    next();
}

const getTransactionList = async (req, res, next) => {
    try {
        console.log("key id isss       ", process.env.RAZOR_PAY_KEY_ID)
        let instance = new Razorpay({
            key_id: process.env.RAZOR_PAY_KEY_ID,
            key_secret: process.env.RAZOR_PAY_KEY_SECRET,
        });

        const list = await instance.payments.all({ count: 100 });
        if (list.length !== 0) {
            res.status(200).json({
                status: 200,
                message: "Transaction list fetch successfully",
                info: list.items
            })
        } else {
            res.status(400).send({
                status: 400,
                message: "Failed! Order not exist"
            })
        }
    } catch (error) {
        return res.status(500).json({
            status: 500,
            error: true,
            message: error.message || error
        })
    }
}

module.exports = { generateOrder, getOrder, getAdminOrder, verifyPayemnt, changeOrderStatus, getTransactionList }