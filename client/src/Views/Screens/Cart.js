/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/img-redundant-alt */
import React, { useEffect, useState } from 'react'
import headerBg from "../../Assets/images/page-header-bg.jpg"
import styled from 'styled-components'
import { useDispatch, useSelector } from "react-redux"
import { checkLoginSession, getUserCart, setLoader } from '../../Database/Action/DashboardAction'
import isEmpty from 'lodash.isempty'
import axios from "axios"
import toast from 'react-hot-toast'
import { postHeaderWithToken } from '../../Database/ApiHeader'
import CartItems from '../Components/CartItems'
import { NavLink, useNavigate } from "react-router-dom"

const Cart = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const userCart = useSelector((state) => state.DashboardReducer.userCart);
    const updateCartItemList = useSelector((state) => state.ConstantReducer.updateCartItemList);

    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [isApplying, setIsApplying] = useState(false);

    const updateCartItem = () => {
        if (updateCartItemList.length === 0) {
            toast.error("Failed! Cart Item is already updated")
        } else {
            let formData = new FormData();
            formData.append("cartItem", JSON.stringify(updateCartItemList))
            axios.post(process.env.REACT_APP_BASE_URL + "updateCartItem", formData, postHeaderWithToken)
                .then((res) => {
                    if (res.data.status === 200) {
                        dispatch(setLoader(false));
                        dispatch(getUserCart())
                        toast.success(res.data.message);
                    }
                })
                .catch((error) => {
                    console.log("error is   ", error)
                    dispatch(setLoader(false));
                    toast.error(error?.response?.data?.message || error.message)
                })
        }
    }

    const handleApplyCoupon = async (e) => {
        e.preventDefault();

        if (!couponCode.trim()) {
            toast.error("Please enter a coupon code");
            return;
        }

        if (userCart.length === 0) {
            toast.error("Your cart is empty");
            return;
        }

        setIsApplying(true);
        const productIds = userCart.map(item => item.productSlug);
        const totalAmount = getTotalSellPrice();

        const requestData = {
            couponCode: couponCode.trim(),
            totalAmount: totalAmount,
            productIds: productIds
        };

        try {
            // Use JSON headers instead of postHeaderWithToken
            const token = localStorage.getItem('token'); // adjust based on how you store token
            const response = await axios.post(
                process.env.REACT_APP_BASE_URL + "validateCoupon",
                requestData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.data.status === 200) {
                setAppliedCoupon(response.data.info);
                setDiscountAmount(response.data.info.discountAmount);
                toast.success(response.data.message);
            }
        } catch (error) {
            console.error("Coupon application error:", error);
            setAppliedCoupon(null);
            setDiscountAmount(0);
            toast.error(error?.response?.data?.message || "Failed to apply coupon");
        } finally {
            setIsApplying(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setDiscountAmount(0);
        setCouponCode("");
        toast.success("Coupon removed successfully");
    };

    const removeCartItem = (id, slug, count) => {
        if (isEmpty(id.toString()) || isEmpty(slug)) {
            toast.error("Failed! Product not found")
        } else if (isEmpty(count.toString())) {
            toast.error("Failed! cart count is not valid")
        } else {
            let formData = new FormData();
            formData.append("productId", id)
            formData.append("productSlug", slug)
            formData.append("cartCount", count)
            dispatch(setLoader(true));
            axios.post(process.env.REACT_APP_BASE_URL + "addCart", formData, postHeaderWithToken)
                .then((res) => {
                    if (res.data.status === 200) {
                        dispatch(setLoader(false));
                        toast.success(res.data.message);
                        // Remove coupon if cart items change
                        if (appliedCoupon) {
                            handleRemoveCoupon();
                        }
                    }
                })
                .catch((error) => {
                    console.log("error is   ", error)
                    dispatch(setLoader(false));
                    toast.error(error?.response?.data?.message || error.message)
                })
        }
    }

    const getTotalSellPrice = () => {
        let priceArray = [];
        priceArray = userCart.map((currELem) => {
            return currELem.cartItemtotalSellPrice
        });

        if (priceArray.length !== 0) {
            return priceArray.reduce((a, b) => {
                return a + b;
            })
        } else {
            return 0;
        }
    }

    const getTotalBasePrice = () => {
        let basePrice = [];

        basePrice = userCart.map((currELem) => {
            return currELem.basePrice
        });

        if (basePrice.length !== 0) {
            const totalBasePrice = basePrice.reduce((a, b) => {
                return a + b;
            })

            return totalBasePrice;
        } else {
            return 0;
        }
    }

    const getGstTax = () => {
        let basePrice = [];
        let priceArray = [];

        priceArray = userCart.map((currELem) => {
            return currELem.cartItemtotalSellPrice
        });

        basePrice = userCart.map((currELem) => {
            return currELem.basePrice
        });

        if (basePrice.length !== 0) {
            const totalBasePrice = basePrice.reduce((a, b) => {
                return a + b;
            })

            const totalSellPrice = priceArray.reduce((a, b) => {
                return a + b;
            })

            return totalSellPrice - totalBasePrice;
        } else {
            return 0;
        }
    }

    const getTotalPrice = () => {
        let priceArray = [];
        priceArray = userCart.map((currELem) => {
            return currELem.cartItemtotalPrice
        });

        if (priceArray.length !== 0) {
            return priceArray.reduce((a, b) => {
                return a + b;
            })
        } else {
            return 0;
        }
    }

    const getFinalAmount = () => {
        const totalSellPrice = getTotalSellPrice();
        const final = totalSellPrice - discountAmount;
        return final > 0 ? final : 0;
    }

    const getDiscountText = () => {
        if (!appliedCoupon) return "";

        const discountType = appliedCoupon.discountType;
        const discountValue = appliedCoupon.discountValue;

        if (discountType === 'percentage' || discountType === '1') {
            return `${discountValue}% off`;
        } else if (discountType === 'fixed' || discountType === '0') {
            return `₹${discountValue} off`;
        }
        return "Discount applied";
    }

    useEffect(() => {
        dispatch(checkLoginSession({ navigate: navigate }))
        dispatch(getUserCart())
    }, [dispatch])

    return (
        <Wrapper>
            <main className="main">
                <div
                    className="page-header text-center"
                    style={{ backgroundImage: `url(${headerBg})` }}
                >
                    <div className="container">
                        <h1 className="page-title">
                            Shopping Cart<span>Shop</span>
                        </h1>
                    </div>
                </div>

                <nav aria-label="breadcrumb" className="breadcrumb-nav">
                    <div className="container">
                        <ol className="breadcrumb">
                            <li className="breadcrumb-item">
                                <a href="index.html">Home</a>
                            </li>
                            <li className="breadcrumb-item">
                                <a href="#">Shop</a>
                            </li>
                            <li className="breadcrumb-item active" aria-current="page">
                                Shopping Cart
                            </li>
                        </ol>
                    </div>
                </nav>

                <div className="page-content">
                    <div className="cart">
                        <div className="container">
                            <div className="row">
                                <div className="col-lg-9">
                                    <table className="table table-cart table-mobile">
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>Price</th>
                                                <th>Quantity</th>
                                                <th>Total</th>
                                                <th />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {userCart?.length !== 0 ?
                                                userCart?.map((item) => {
                                                    return (
                                                        <CartItems key={item.id} {...item} />
                                                    )
                                                })
                                                : <tr><td colSpan="5" className="text-center">Your cart is empty</td></tr>}
                                        </tbody>
                                    </table>

                                    <div className="cart-bottom">
                                        <div className="cart-discount">
                                            <form onSubmit={handleApplyCoupon}>
                                                <div className="input-group">
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        required
                                                        placeholder="Enter coupon code"
                                                        value={couponCode}
                                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                        disabled={appliedCoupon !== null || isApplying}
                                                    />
                                                    <div className="input-group-append">
                                                        {appliedCoupon ? (
                                                            <button
                                                                className="btn btn-outline-danger"
                                                                type="button"
                                                                onClick={handleRemoveCoupon}
                                                                disabled={isApplying}
                                                            >
                                                                <i className="icon-close" />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                className="btn btn-outline-primary-2"
                                                                type="submit"
                                                                disabled={isApplying || !couponCode.trim()}
                                                            >
                                                                {isApplying ? (
                                                                    <i className="icon-loading spinner" />
                                                                ) : (
                                                                    <i className="icon-long-arrow-right" />
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </form>
                                            {appliedCoupon && (
                                                <div className="coupon-applied mt-2">
                                                    <small className="text-success">
                                                        <strong>{appliedCoupon.coupon}</strong> applied!
                                                        {getDiscountText()} - ₹{discountAmount.toFixed(2)}
                                                    </small>
                                                </div>
                                            )}
                                        </div>

                                        <a className="btn btn-outline-dark-2 cursor-pointer" onClick={() => updateCartItem()}>
                                            <span>UPDATE CART</span>
                                            <i className="icon-refresh" />
                                        </a>
                                    </div>
                                </div>

                                <aside className="col-lg-3">
                                    <div className="summary summary-cart">
                                        <h3 className="summary-title">Cart Total</h3>
                                        <table className="table table-summary">
                                            <tbody>
                                                <tr className="summary-subtotal">
                                                    <td>Subtotal:</td>
                                                    <td>₹{getTotalSellPrice().toFixed(2)}</td>
                                                </tr>

                                                {appliedCoupon && (
                                                    <tr className="summary-discount">
                                                        <td>Discount:</td>
                                                        <td>-₹{discountAmount.toFixed(2)}</td>
                                                    </tr>
                                                )}

                                                <tr className="summary-shipping">
                                                    <td>Shipping:</td>
                                                    <td>&nbsp;</td>
                                                </tr>

                                                <tr className="summary-shipping-row">
                                                    <td>
                                                        <div className="custom-control custom-radio">
                                                            <input
                                                                type="radio"
                                                                id="standart-shipping"
                                                                name="shipping"
                                                                className="custom-control-input"
                                                                defaultChecked
                                                            />
                                                            <label className="custom-control-label" htmlFor="standart-shipping">
                                                                Standard Shipping
                                                            </label>
                                                        </div>
                                                    </td>
                                                    <td>₹200.00</td>
                                                </tr>

                                                <tr className="summary-shipping-row">
                                                    <td>
                                                        <div className="custom-control custom-radio">
                                                            <input
                                                                type="radio"
                                                                id="express-shipping"
                                                                name="shipping"
                                                                className="custom-control-input"
                                                            />
                                                            <label className="custom-control-label" htmlFor="express-shipping">
                                                                Express Shipping
                                                            </label>
                                                        </div>
                                                    </td>
                                                    <td>₹500.00</td>
                                                </tr>

                                                <tr className="summary-total">
                                                    <td>Total:</td>
                                                    <td>₹{getFinalAmount().toFixed(2)}</td>
                                                </tr>
                                            </tbody>
                                        </table>



                                        <NavLink
                                            to="/checkout"
                                            className="btn btn-outline-primary-2 btn-order btn-block"
                                            state={{
                                                appliedCoupon,
                                                discountAmount,
                                                couponCode: appliedCoupon?.coupon,
                                                discountedTotal: getFinalAmount(), // Add this line
                                                originalTotal: getTotalSellPrice(), // Add this line
                                                cartItems: userCart // Pass cart items for reference
                                            }}
                                        >
                                            PROCEED TO CHECKOUT
                                        </NavLink>
                                    </div>

                                    <NavLink to={"/products"} className="btn btn-outline-dark-2 btn-block mb-3">
                                        <span>CONTINUE SHOPPING</span>
                                        <i className="icon-refresh" />
                                    </NavLink>
                                </aside>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </Wrapper>
    )
}

const Wrapper = styled.section`
  .form-control1 {
    height: 40px;
    width: 100px;
    font-size: 1.4rem;
    line-height: 1.5;
    font-weight: 300;
    display: flex;
    align-self: center;
    align-items: center;
    justify-content: center;
    color: #777;
    background-color: #fafafa;
    border: 1px solid #ebebeb;
    border-radius: 0;
    box-shadow: none;
  }
  
  .coupon-applied {
    background-color: #d4edda;
    padding: 8px 12px;
    border-radius: 4px;
    border: 1px solid #c3e6cb;
  }
  
  .summary-discount {
    color: #28a745;
    font-weight: bold;
  }
  
  .spinner {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
export default Cart