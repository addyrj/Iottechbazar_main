const isEmpty = require("lodash.isempty");
const db = require("../../DB/config");
const { checkRoutePermission } = require("../Function/RouteAuth");
const ErrorNullResponse = require("../Helper/ErrorNullResponse");
const { generateProductSlug } = require("../Helper/GenerateToken");

const Coupon = db.coupon;

const createCoupons = async (req, res, next) => {
    try {
        const admin = req.admin;
        const { 
            coupon, 
            categoryId, 
            scopeType, // NEW: 'all_products' or 'specific_products'
            productIds, // NEW: array of product IDs
            discountType, 
            minPurchaseAmount, 
            discountValue, 
            startDate, 
            expiryDate, 
            url 
        } = req.body;
        
        const errorResponse = await ErrorNullResponse(req.body);

        if (!admin) {
            return res.status(300).send({
                status: 300,
                message: "Failed! You have not authorized"
            })
        } else if (errorResponse.length !== 0) {
            return res.status(300).send({
                status: 300,
                message: errorResponse
            })
        } else {
            const checkPermission = await checkRoutePermission(admin, url);
            if (checkPermission === true) {
                const slug = await generateProductSlug(coupon);
                
                // Validate scopeType and productIds
                if (scopeType === 'specific_products' && (!productIds || !Array.isArray(productIds) || productIds.length === 0)) {
                    return res.status(300).json({
                        status: 300,
                        message: "Failed! Please select at least one product for specific products scope"
                    })
                }

                const info = {
                    slug: slug,
                    coupon: coupon,
                    categoryId: categoryId,
                    scopeType: scopeType || 'all_products',
                    productIds: scopeType === 'specific_products' ? JSON.stringify(productIds) : null,
                    discountType: discountType,
                    min_purchase_amount: minPurchaseAmount,
                    discountValue: discountValue,
                    startDate: startDate,
                    expireDate: expiryDate,
                    avatar: req.file !== undefined ? req.file.filename : null,
                    status: "true",
                    createdBy: admin.role
                }

                await Coupon.create(info)
                    .then((result) => {
                        return res.status(200).json({
                            status: 200,
                            message: "Coupon Create Successfull",
                            info: result
                        })
                    })
                    .catch((error) => {
                        return res.status(300).json({
                            status: 300,
                            message: "Failed! Coupon not Created",
                            info: error
                        })
                    })

            } else {
                return res.status(300).send({
                    status: 300,
                    message: "Authorization Failed!"
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

const getCoupons = async (req, res, next) => {
    try {
        const admin = req.admin;
        if (!admin) {
            return res.status(300).send({
                status: 300,
                message: "Failed! You have not authorized"
            })
        } else {
            const checkCoupons = await Coupon.findAll();
            if (checkCoupons.length !== 0) {
                // Parse productIds for response
                const couponsWithParsedData = checkCoupons.map(coupon => ({
                    ...coupon.toJSON(),
                    productIds: coupon.productIds ? JSON.parse(coupon.productIds) : []
                }));
                
                return res.status(200).json({
                    status: 200,
                    message: "Coupon data fetch successfully",
                    info: couponsWithParsedData
                })
            } else {
                return res.status(400).send({
                    status: 400,
                    message: "Failed! Coupon is not found"
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

// const getCouponDetail = async (req, res, next) => {
//     try {
//         const { couponCode, amount, productId } = req.body;
//         const admin = req.admin;
        
//         if (!admin) {
//             return res.status(300).send({
//                 status: 300,
//                 message: "Failed! You have not authorized"
//             })
//         }

//         if (!couponCode) {
//             return res.status(300).send({
//                 status: 300,
//                 message: "Coupon code is required"
//             })
//         }

//         const coupon = await Coupon.findOne({ where: { coupon: couponCode, status: "true" } });
        
//         if (!coupon) {
//             return res.status(400).send({
//                 status: 400,
//                 message: "Invalid coupon code"
//             })
//         }

//         // Check if coupon is active
//         const currentDate = new Date();
//         const startDate = new Date(coupon.startDate);
//         const expireDate = new Date(coupon.expireDate);

//         if (currentDate < startDate || currentDate > expireDate) {
//             return res.status(400).send({
//                 status: 400,
//                 message: "Coupon is not active"
//             })
//         }

//         // Check minimum purchase amount
//         if (amount && parseFloat(amount) < parseFloat(coupon.min_purchase_amount)) {
//             return res.status(400).send({
//                 status: 400,
//                 message: `Minimum purchase amount should be ${coupon.min_purchase_amount}`
//             })
//         }

//         // NEW: Check product eligibility
//         if (productId) {
//             if (coupon.scopeType === 'specific_products') {
//                 const allowedProductIds = coupon.productIds ? JSON.parse(coupon.productIds) : [];
//                 if (!allowedProductIds.includes(productId)) {
//                     return res.status(400).send({
//                         status: 400,
//                         message: "This coupon is not applicable for the selected product"
//                     })
//                 }
//             }
//             // For 'all_products', all products in the category are eligible
//         }

//         // Calculate discount
//         let discountAmount = 0;
//         if (coupon.discountType === 'percentage') {
//             discountAmount = (parseFloat(amount) * parseFloat(coupon.discountValue)) / 100;
//         } else if (coupon.discountType === 'fixed') {
//             discountAmount = parseFloat(coupon.discountValue);
//         }

//         return res.status(200).json({
//             status: 200,
//             message: "Coupon applied successfully",
//             info: {
//                 coupon: coupon.coupon,
//                 discountType: coupon.discountType,
//                 discountValue: coupon.discountValue,
//                 discountAmount: discountAmount,
//                 finalAmount: parseFloat(amount) - discountAmount,
//                 scopeType: coupon.scopeType,
//                 applicableProducts: coupon.scopeType === 'specific_products' ? 
//                     (coupon.productIds ? JSON.parse(coupon.productIds) : []) : 'all_products_in_category'
//             }
//         })

//     } catch (error) {
//         return res.status(500).json({
//             status: 500,
//             error: true,
//             message: error.message || error
//         })
//     }
// }

const updateCoupon = async (req, res, next) => {
    try {
        const admin = req.admin;
        const { 
            id, 
            coupon, 
            categoryId, 
            scopeType, 
            productIds, 
            discountType, 
            minPurchaseAmount, 
            discountValue, 
            startDate, 
            expiryDate, 
            url 
        } = req.body;

        if (!admin) {
            return res.status(300).send({
                status: 300,
                message: "Failed! You have not authorized"
            })
        }

        const checkPermission = await checkRoutePermission(admin, url);
        if (!checkPermission) {
            return res.status(300).send({
                status: 300,
                message: "Authorization Failed!"
            })
        }

        const existingCoupon = await Coupon.findByPk(id);
        if (!existingCoupon) {
            return res.status(400).send({
                status: 400,
                message: "Coupon not found"
            })
        }

        // Validate scopeType and productIds
        if (scopeType === 'specific_products' && (!productIds || !Array.isArray(productIds) || productIds.length === 0)) {
            return res.status(300).json({
                status: 300,
                message: "Failed! Please select at least one product for specific products scope"
            })
        }

        const updateData = {
            coupon: coupon || existingCoupon.coupon,
            categoryId: categoryId || existingCoupon.categoryId,
            scopeType: scopeType || existingCoupon.scopeType,
            productIds: scopeType === 'specific_products' ? JSON.stringify(productIds) : null,
            discountType: discountType || existingCoupon.discountType,
            min_purchase_amount: minPurchaseAmount || existingCoupon.min_purchase_amount,
            discountValue: discountValue || existingCoupon.discountValue,
            startDate: startDate || existingCoupon.startDate,
            expireDate: expiryDate || existingCoupon.expireDate,
            avatar: req.file !== undefined ? req.file.filename : existingCoupon.avatar,
            updatedBy: admin.role
        }

        await Coupon.update(updateData, { where: { id } })
            .then(() => {
                return res.status(200).json({
                    status: 200,
                    message: "Coupon updated successfully"
                })
            })
            .catch((error) => {
                return res.status(300).json({
                    status: 300,
                    message: "Failed! Coupon not updated",
                    info: error
                })
            })

    } catch (error) {
        return res.status(500).json({
            status: 500,
            error: true,
            message: error.message || error
        })
    }
}

const deleteCoupon = async (req, res, next) => {
    try {
        const admin = req.admin;
        const { id, url } = req.body;

        if (!admin) {
            return res.status(300).send({
                status: 300,
                message: "Failed! You have not authorized"
            })
        }

        const checkPermission = await checkRoutePermission(admin, url);
        if (!checkPermission) {
            return res.status(300).send({
                status: 300,
                message: "Authorization Failed!"
            })
        }

        const coupon = await Coupon.findByPk(id);
        if (!coupon) {
            return res.status(400).send({
                status: 400,
                message: "Coupon not found"
            })
        }

        await Coupon.destroy({ where: { id } })
            .then(() => {
                return res.status(200).json({
                    status: 200,
                    message: "Coupon deleted successfully"
                })
            })
            .catch((error) => {
                return res.status(300).json({
                    status: 300,
                    message: "Failed! Coupon not deleted",
                    info: error
                })
            })

    } catch (error) {
        return res.status(500).json({
            status: 500,
            error: true,
            message: error.message || error
        })
    }
}
const changeCouponStatus = async (req, res, next) => {
    try {
        const admin = req.admin;
        const { id, status, url } = req.body;

        if (!admin) {
            return res.status(300).send({
                status: 300,
                message: "Failed! You have not authorized"
            })
        }

        const checkPermission = await checkRoutePermission(admin, url);
        if (!checkPermission) {
            return res.status(300).send({
                status: 300,
                message: "Authorization Failed!"
            })
        }

        const coupon = await Coupon.findByPk(id);
        if (!coupon) {
            return res.status(400).send({
                status: 400,
                message: "Coupon not found"
            })
        }

        await Coupon.update({ status: status }, { where: { id } })
            .then(() => {
                return res.status(200).json({
                    status: 200,
                    message: `Coupon ${status === "true" ? "activated" : "deactivated"} successfully`
                })
            })
            .catch((error) => {
                return res.status(300).json({
                    status: 300,
                    message: "Failed! Coupon status not updated",
                    info: error
                })
            })

    } catch (error) {
        return res.status(500).json({
            status: 500,
            error: true,
            message: error.message || error
        })
    }
}
const validateCoupon = async (req, res, next) => {
    try {
        const { couponCode, totalAmount, productIds } = req.body;
        
        console.log("Received coupon validation request:", { couponCode, totalAmount, productIds });
        
        if (!couponCode || couponCode.trim() === "") {
            return res.status(300).send({
                status: 300,
                message: "Coupon code is required"
            })
        }

        const coupon = await Coupon.findOne({ 
            where: { 
                coupon: couponCode.trim(), 
                status: "true" 
            } 
        });
        
        if (!coupon) {
            return res.status(400).send({
                status: 400,
                message: "Invalid coupon code"
            })
        }

        console.log("Found coupon:", coupon.coupon, "Discount Type:", coupon.discountType);

        // Check if coupon is active based on dates
        const currentDate = new Date();
        const startDate = new Date(coupon.startDate);
        const expireDate = new Date(coupon.expireDate);

        if (currentDate < startDate) {
            return res.status(400).send({
                status: 400,
                message: "This coupon is not active yet"
            })
        }

        if (currentDate > expireDate) {
            return res.status(400).send({
                status: 400,
                message: "This coupon has expired"
            })
        }

        // Check minimum purchase amount
        const minAmount = parseFloat(coupon.min_purchase_amount);
        const cartAmount = parseFloat(totalAmount);
        
        if (cartAmount < minAmount) {
            return res.status(400).send({
                status: 400,
                message: `Minimum purchase amount should be ₹${minAmount}`
            })
        }

        // Check product eligibility if specific products scope
        if (coupon.scopeType === 'specific_products' && productIds && productIds.length > 0) {
            const allowedProductIds = coupon.productIds ? JSON.parse(coupon.productIds) : [];
            const hasEligibleProduct = productIds.some(productId => 
                allowedProductIds.includes(productId)
            );
            
            if (!hasEligibleProduct) {
                return res.status(400).send({
                    status: 400,
                    message: "This coupon is not applicable for the selected products"
                })
            }
        }

        // Calculate discount - Handle both string values ("0", "1") and descriptive values
        let discountAmount = 0;
        let finalAmount = cartAmount;
        const discountValue = parseFloat(coupon.discountValue);
        
        console.log("Discount calculation:", {
            discountType: coupon.discountType,
            discountValue: discountValue,
            cartAmount: cartAmount
        });

        // Handle different discount type formats
        if (coupon.discountType === 'percentage' || coupon.discountType === '1' || coupon.discountType === 1) {
            discountAmount = (cartAmount * discountValue) / 100;
            finalAmount = cartAmount - discountAmount;
            console.log("Percentage discount:", discountAmount);
        } else if (coupon.discountType === 'fixed' || coupon.discountType === '0' || coupon.discountType === 0) {
            discountAmount = discountValue;
            finalAmount = cartAmount - discountAmount;
            console.log("Fixed discount:", discountAmount);
        } else {
            return res.status(400).send({
                status: 400,
                message: "Invalid discount type"
            })
        }

        // Ensure discount doesn't make amount negative
        if (finalAmount < 0) {
            finalAmount = 0;
            discountAmount = cartAmount;
        }

        console.log("Final calculation:", {
            discountAmount: discountAmount,
            finalAmount: finalAmount
        });

        return res.status(200).json({
            status: 200,
            message: "Coupon applied successfully",
            info: {
                couponId: coupon.id,
                coupon: coupon.coupon,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                discountAmount: Math.round(discountAmount * 100) / 100, // Round to 2 decimal places
                finalAmount: Math.round(finalAmount * 100) / 100,
                scopeType: coupon.scopeType,
                minPurchaseAmount: coupon.min_purchase_amount
            }
        })

    } catch (error) {
        console.error("Coupon validation error:", error);
        return res.status(500).json({
            status: 500,
            error: true,
            message: error.message || "Internal server error"
        })
    }
}

module.exports = { createCoupons, getCoupons, deleteCoupon, updateCoupon, changeCouponStatus, validateCoupon }

