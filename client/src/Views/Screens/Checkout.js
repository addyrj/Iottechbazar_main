/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useCallback, useEffect, useState } from 'react'
import headerBg from "../../Assets/images/page-header-bg.jpg"
import axios from "axios";
import { getHeaderWithoutToken, postHeaderWithToken } from '../../Database/ApiHeader';
import toast from 'react-hot-toast';
import useRazorpay from "react-razorpay";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useNavigate } from 'react-router-dom';
import { getUserAddress, getUserCart, setLoader } from '../../Database/Action/DashboardAction'
import styled from "styled-components"
import Checkbox from '@mui/material/Checkbox';
import { blue, pink } from '@mui/material/colors';
import isEmpty from 'lodash.isempty';
import { ExpandMore, ExpandLess, LocationOn, Payment, ShoppingCart } from '@mui/icons-material';

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [Razorpay] = useRazorpay();

  const location = useLocation();

  const { 
    buyNowMode = false, 
    buyNowItem = null,
    appliedCoupon = null,
    discountAmount = 0,
    discountedTotal = null,
    originalTotal = null,
    couponCode = null
  } = location.state || {};

  const addressList = useSelector((state) => state.DashboardReducer.userAddress);
  const userCart = useSelector((state) => state.DashboardReducer.userCart);

  // Use buyNowItem if in buy now mode, otherwise use cart
  const checkoutItems = buyNowMode && buyNowItem ? [buyNowItem] : userCart;
  
  // State to manage discount data
  const [couponData, setCouponData] = useState({
    appliedCoupon,
    discountAmount,
    discountedTotal,
    originalTotal,
    couponCode
  });

  const [expandedSections, setExpandedSections] = useState({
    address: false,
    payment: true,
    orderSummary: false
  });

  const [payState, setPayState] = useState({
    cod: "0",
    onlinePay: "1"
  });

  const [selectedAddress, setSelectedAddress] = useState(null);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleAddressSelect = (address) => {
    if (selectedAddress?.id === address.id) {
      setSelectedAddress(null);
    } else {
      setSelectedAddress(address);
    }
  };

  // Handle Edit Address
  const handleEditAddress = (address) => {
    console.log("Address to edit:", address);
    navigate("/editAddress", { state: { addressData: address } });
  };

  // Handle Delete Address
  const handleDeleteAddress = async (addressId) => {
    if (window.confirm("Are you sure you want to delete this address?")) {
      try {
        dispatch(setLoader(true));
        const response = await axios.post(
          process.env.REACT_APP_BASE_URL + "deleteAddress",
          { addressId: addressId },
          postHeaderWithToken
        );

        if (response.data.status === 200) {
          toast.success(response.data.message);
          dispatch(getUserAddress({ navigate: navigate }));

          if (selectedAddress?.id === addressId) {
            setSelectedAddress(null);
          }
        } else {
          toast.error(response.data.message);
        }
      } catch (error) {
        console.error("Delete address error:", error);
        toast.error(error?.response?.data?.message || "Failed to delete address");
      } finally {
        dispatch(setLoader(false));
      }
    }
  };

  // Auto-select default address on component load
  useEffect(() => {
    if (addressList.length > 0 && !selectedAddress) {
      const defaultAddress = addressList.find(addr => addr.defaultAddress === "true");
      if (defaultAddress) {
        setSelectedAddress(defaultAddress);
      } else {
        setSelectedAddress(addressList[0]);
      }
    }
  }, [addressList, selectedAddress]);

  // Calculate totals with discount consideration
  const getTotalSellPrice = () => {
    // If we have discounted total from cart, use it
    if (couponData.discountedTotal !== null && couponData.discountedTotal !== undefined) {
      return couponData.discountedTotal;
    }
    
    // Otherwise calculate normally
    let priceArray = checkoutItems.map((currELem) => currELem.cartItemtotalSellPrice);
    return priceArray.length !== 0 ? priceArray.reduce((a, b) => a + b) : 0;
  }

  const getOriginalTotal = () => {
    // If we have original total from cart, use it
    if (couponData.originalTotal !== null && couponData.originalTotal !== undefined) {
      return couponData.originalTotal;
    }
    
    // Otherwise calculate normally
    let priceArray = checkoutItems.map((currELem) => currELem.cartItemtotalSellPrice);
    return priceArray.length !== 0 ? priceArray.reduce((a, b) => a + b) : 0;
  }

  const getTotalBasePrice = () => {
    let basePrice = checkoutItems.map((currELem) => currELem.basePrice || currELem.cartSellPrice);
    return basePrice.length !== 0 ? basePrice.reduce((a, b) => a + b) : 0;
  }

  const getGstTax = () => {
    let basePrice = checkoutItems.map((currELem) => currELem.basePrice || currELem.cartSellPrice);
    let priceArray = checkoutItems.map((currELem) => currELem.cartItemtotalSellPrice);

    if (basePrice.length !== 0) {
      const totalBasePrice = basePrice.reduce((a, b) => a + b);
      const totalSellPrice = priceArray.reduce((a, b) => a + b);
      return totalSellPrice - totalBasePrice;
    } else {
      return 0;
    }
  }

  const getAddressType = (addType) => {
    const types = {
      "0": "Home",
      "1": "Office",
      "2": "Other"
    };
    return types[addType] || "Other";
  }

  const getAddressTypeIcon = (addType) => {
    const icons = {
      "0": "🏠",
      "1": "🏢",
      "2": "📍"
    };
    return icons[addType] || "📍";
  }

  // Update generateOrder function to use discounted total
  const generateOrder = async () => {
    if (!selectedAddress) {
      toast.error("Please select an address to continue");
      return;
    }

    let totalPrice = getTotalSellPrice(); // This now includes discount if applied
    let paymentMode = payState.cod === "1" ? "0" : "1";

    if (isEmpty(totalPrice.toString())) {
      toast.error("Failed! Amount is not valid")
    } else {
      dispatch(setLoader(true));

      const requestData = {
        amount: totalPrice,
        paymentMode: paymentMode,
        selectedAddressId: selectedAddress?.id,
        buyNowMode: buyNowMode,
        buyNowItem: buyNowMode ? buyNowItem : null,
        // Add coupon data to order
        couponData: couponData.appliedCoupon ? {
          couponCode: couponData.appliedCoupon.coupon,
          discountAmount: couponData.discountAmount,
          originalAmount: couponData.originalTotal
        } : null
      };

      axios.post(process.env.REACT_APP_BASE_URL + "generateOrder", requestData, postHeaderWithToken)
        .then((res) => {
          if (res.data.status === 200) {
            dispatch(setLoader(false));
            if (payState.onlinePay === "1") {
              startPayment(res.data.info);
            } else {
              navigate("/");
              window.location.reload(false)
              toast.success(res.data.message);
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

  const paymentVerification = (data) => {
    const orderId = data.razorpay_order_id;
    const paymentId = data.razorpay_payment_id;
    const razorPaySignature = data.razorpay_signature;

    let formData = new FormData();
    formData.append("orderId", orderId);
    formData.append("paymentId", paymentId);
    formData.append("rPaySignature", razorPaySignature);
    formData.append("buyNowMode", buyNowMode);
    
    dispatch(setLoader(true));
    axios.post(process.env.REACT_APP_BASE_URL + "verifyPayment", formData, postHeaderWithToken)
      .then((res) => {
        if (res.data.status === 200) {
          dispatch(setLoader(false));
          navigate("/");
          window.location.reload(false)
          toast.success(res.data.message);
        }
      })
      .catch((error) => {
        console.log("error is   ", error)
        dispatch(setLoader(false));
        toast.error(error?.response?.data?.message || error.message)
      })
  }

  const startPayment = useCallback((data) => {
    const options = {
      key: data.notes.key_id,
      amount: data.amount,
      currency: data.currency,
      name: data.notes.name,
      description: data.notes.description,
      image: process.env.REACT_APP_IMAGE_URL + data.notes.image,
      order_id: data.id,
      handler: (res) => {
        paymentVerification(res)
      },
      prefill: {
        name: data.notes.userName,
        email: data.notes.userEmail,
        contact: data.notes.userContact,
      },
      notes: {
        address: data.notes.address,
      },
      theme: {
        color: data.notes.themeColor,
      },
    };

    const rzpay = new Razorpay(options);
    rzpay.on("payment.failed", function (response) {
      toast.error(response.error.code);
      toast.error(response.error.description);
      toast.error(response.error.source);
      toast.error(response.error.step);
      toast.error(response.error.reason);
      toast.error(response.error.metadata.order_id);
      toast.error(response.error.metadata.payment_id);
    });
    rzpay.open();
  }, [Razorpay])

  // Render order summary with discount breakdown
  const renderOrderSummary = () => {
    const originalTotal = getOriginalTotal();
    const finalTotal = getTotalSellPrice();
    const hasDiscount = couponData.appliedCoupon && couponData.discountAmount > 0;
    const shippingCost = 200;
    const taxAmount = getGstTax();
    const grandTotal = finalTotal + shippingCost;

    return (
      <div className="order-summary-card">
        <h4>Order Summary</h4>
        
        {hasDiscount && (
          <>
            <div className="summary-row">
              <span>Original Total:</span>
              <span>₹{originalTotal.toFixed(2)}</span>
            </div>
            <div className="summary-row discount">
              <span>Discount:</span>
              <span>-₹{couponData.discountAmount.toFixed(2)}</span>
            </div>
            <div className="summary-divider" />
          </>
        )}
        
        <div className="summary-row">
          <span>Subtotal:</span>
          <span>₹{finalTotal.toFixed(2)}</span>
        </div>
        
        <div className="summary-row">
          <span>Shipping:</span>
          <span>₹{shippingCost.toFixed(2)}</span>
        </div>
        
        <div className="summary-row">
          <span>Tax (GST):</span>
          <span>₹{taxAmount.toFixed(2)}</span>
        </div>
        
        <div className="summary-divider" />
        
        <div className="summary-row total">
          <strong>Total Amount:</strong>
          <strong>₹{grandTotal.toFixed(2)}</strong>
        </div>

        {hasDiscount && (
          <div className="coupon-info">
            <small className="text-success">
              Coupon <strong>{couponData.appliedCoupon.coupon}</strong> applied
              {couponData.appliedCoupon.discountType === 'percentage' || couponData.appliedCoupon.discountType === '1' 
                ? ` (${couponData.appliedCoupon.discountValue}% off)`
                : ` (₹${couponData.appliedCoupon.discountValue} off)`
              }
            </small>
          </div>
        )}

        <button
          className="btn btn-checkout"
          onClick={generateOrder}
          disabled={!selectedAddress}
        >
          <span>Place Order</span>
          <i className="icon-long-arrow-right" />
        </button>

        {!selectedAddress && (
          <p className="warning-text">Please select a delivery address</p>
        )}
      </div>
    );
  }

  useEffect(() => {
    if (addressList.length === 0) {
      dispatch(getUserAddress({ navigate: navigate }))
    }

    // Only fetch cart if NOT in buy now mode
    if (!buyNowMode && userCart.length === 0) {
      dispatch(getUserCart({ navigate: navigate }))
    }
  }, [dispatch, buyNowMode])

  return (
    <Wrapper>
      <main className="main">
        <div
          className="page-header text-center"
          style={{ backgroundImage: `url(${headerBg})` }}
        >
          <div className="container">
            <h1 className="page-title">
              <span>Checkout</span>
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
                Checkout
              </li>
            </ol>
          </div>
        </nav>
        <div className="page-content">
          <div className="container">
            {/* Address Section - Dropdown */}
            <div className="checkout-section">
              <div
                className="section-header cursor-pointer"
                onClick={() => toggleSection('address')}
              >
                <div className="section-title">
                  <LocationOn className="section-icon" />
                  <h3>Delivery Address</h3>
                  {selectedAddress && (
                    <span className="selected-badge">Selected</span>
                  )}
                </div>
                {expandedSections.address ? <ExpandLess /> : <ExpandMore />}
              </div>

              {/* Collapsed View - Show selected address when not expanded */}
              {!expandedSections.address && selectedAddress && (
                <div className="section-content collapsed">
                  <div
                    className="address-card selected preview"
                    onClick={() => toggleSection('address')}
                  >
                    <div className="address-header">
                      <span className="address-type">
                        {getAddressTypeIcon(selectedAddress.addressType)} {getAddressType(selectedAddress.addressType)}
                      </span>
                      {selectedAddress.defaultAddress === "true" && (
                        <span className="default-badge">Default</span>
                      )}
                    </div>
                    <div className="address-body">
                      <p className="address-name">{selectedAddress.name}</p>
                      <p className="address-contact">{selectedAddress.contact}</p>
                      <p className="address-text">
                        {selectedAddress.address1} {selectedAddress.address2}
                      </p>
                      <p className="address-pincode">Pincode: {selectedAddress.pincode}</p>
                    </div>
                    <div className="preview-overlay">
                      <span className="click-to-expand">Click to view all addresses</span>
                    </div>
                  </div>
                </div>
              )}

              {/* No address selected state */}
              {!expandedSections.address && !selectedAddress && (
                <div className="section-content collapsed">
                  <div className="empty-state preview">
                    <p>No address selected</p>
                    <button
                      className="btn btn-primary"
                      onClick={() => toggleSection('address')}
                    >
                      <span>Select Address</span>
                      <i className="icon-long-arrow-right" />
                    </button>
                  </div>
                </div>
              )}

              {/* Expanded View - Show all addresses */}
              {expandedSections.address && (
                <div className="section-content expanded">
                  {addressList.length === 0 ? (
                    <div className="empty-state">
                      <p>No addresses found. Please add a delivery address.</p>
                      <NavLink to="/addAddress" className="btn btn-primary">
                        <span>Add New Address</span>
                        <i className="icon-long-arrow-right" />
                      </NavLink>
                    </div>
                  ) : (
                    <>
                      <div className="address-grid">
                        {addressList.map((item, index) => (
                          <div
                            className={`address-card ${selectedAddress?.id === item.id ? 'selected' : ''}`}
                            key={index}
                            onClick={() => handleAddressSelect(item)}
                          >
                            <div className="address-header">
                              <span className="address-type">
                                {getAddressTypeIcon(item.addressType)} {getAddressType(item.addressType)}
                              </span>
                              <input
                                type="radio"
                                name="address"
                                checked={selectedAddress?.id === item.id}
                                onChange={() => handleAddressSelect(item)}
                                className="address-radio"
                              />
                            </div>
                            <div className="address-body">
                              <p className="address-name">{item.name}</p>
                              <p className="address-contact">{item.contact}</p>
                              <p className="address-text">
                                {item.address1} {item.address2}
                              </p>
                              <p className="address-pincode">Pincode: {item.pincode}</p>
                              {item.defaultAddress === "true" && (
                                <span className="default-badge">Default</span>
                              )}
                            </div>
                            <div className="address-actions">
                              <button
                                className="btn btn-edit"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditAddress(item);
                                }}
                              >
                                <i className="icon-edit" />
                                Edit
                              </button>
                              <button
                                className="btn btn-delete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteAddress(item.id);
                                }}
                              >
                                <i className="icon-trash" />
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="text-right mt-3">
                        <NavLink to="/addAddress" className="btn btn-outline">
                          <i className="icon-plus" />
                          Add New Address
                        </NavLink>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Payment Section - Dropdown */}
            <div className="checkout-section">
              <div
                className="section-header cursor-pointer"
                onClick={() => toggleSection('payment')}
              >
                <div className="section-title">
                  <Payment className="section-icon" />
                  <h3>Payment Method</h3>
                </div>
                {expandedSections.payment ? <ExpandLess /> : <ExpandMore />}
              </div>

              {expandedSections.payment && (
                <div className="section-content">
                  <div className="payment-container">
                    <div className="payment-methods">
                      <div className="payment-option">
                        <Checkbox
                          checked={payState.cod === "1"}
                          sx={{
                            color: blue[800],
                            '&.Mui-checked': { color: blue[600] },
                            '& .MuiSvgIcon-root': { fontSize: 28 }
                          }}
                          onChange={() => setPayState({ cod: "1", onlinePay: "0" })}
                        />
                        <div className="payment-info">
                          <span className="payment-title">Cash on Delivery (COD)</span>
                          <span className="payment-desc">Pay when you receive your order</span>
                        </div>
                      </div>

                      <div className="payment-option">
                        <Checkbox
                          checked={payState.onlinePay === "1"}
                          sx={{
                            color: pink[800],
                            '&.Mui-checked': { color: pink[600] },
                            '& .MuiSvgIcon-root': { fontSize: 28 }
                          }}
                          onChange={() => setPayState({ onlinePay: "1", cod: "0" })}
                        />
                        <div className="payment-info">
                          <span className="payment-title">Online Payment</span>
                          <span className="payment-desc">Pay securely with Razorpay</span>
                        </div>
                      </div>
                    </div>

                    {renderOrderSummary()}
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary Section - Dropdown */}
            <div className="checkout-section">
              <div
                className="section-header cursor-pointer"
                onClick={() => toggleSection('orderSummary')}
              >
                <div className="section-title">
                  <ShoppingCart className="section-icon" />
                  <h3>Order Items ({checkoutItems.length})</h3>
                </div>
                {expandedSections.orderSummary ? <ExpandLess /> : <ExpandMore />}
              </div>

              {expandedSections.orderSummary && (
                <div className="section-content">
                  <div className="order-items-table">
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th className="text-center">Price</th>
                            <th className="text-center">Qty</th>
                            <th className="text-center">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {checkoutItems.map((item, index) => (
                            <tr key={index}>
                              <td>
                                <div className="product-info">
                                  <img
                                    src={process.env.REACT_APP_IMAGE_URL + item.cartImage}
                                    alt={item.cartProductName}
                                    className="product-image"
                                  />
                                  <span className="product-name">{item.cartProductName}</span>
                                </div>
                              </td>
                              <td className="text-center">₹{item.cartSellPrice}</td>
                              <td className="text-center">{item.cartCount}</td>
                              <td className="text-center">₹{item.cartItemtotalSellPrice}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </Wrapper>
  )
}

const Wrapper = styled.section`
  .checkout-section {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
    margin-bottom: 24px;
    overflow: hidden;
    border: 1px solid #e9ecef;
    
    &:last-child {
      margin-bottom: 0;
    }
  }

  .section-header {
    display: flex;
    justify-content: between;
    align-items: center;
    padding: 14px 24px;
    background: linear-gradient(135deg, #a6c76c 0%, #7aa33a 100%);
    color: white;
    transition: all 0.3s ease;
    
    &:hover {
      background: linear-gradient(135deg, #a6c76c 0%, #5b8c2a 100%);
    }
  }

  .section-title {
    display: flex;
    align-items: center;
    flex: 1;
    
    h3 {
      margin: 0;
      font-weight: 600;
    }
  }

  .section-icon {
    margin-right: 12px;
    font-size: 1.5rem !important;
  }

  .selected-badge {
    background: rgba(255, 255, 255, 0.2);
    padding: 4px 12px;
    border-radius: 20px;
    margin-left: 12px;
    backdrop-filter: blur(10px);
  }

  .section-content {
    &.collapsed {
      padding: 16px 24px;
      border-top: 1px solid #e9ecef;
    }
    
    &.expanded {
      padding: 24px;
    }
  }

  /* Address Styles */
  .empty-state {
    text-align: center;
    padding: 40px 20px;
    
    p {
      margin-bottom: 20px;
      font-size: 1.1rem;
    }
  }

  .address-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 20px;
    margin-bottom: 20px;
  }

  .address-card {
    border: 2px solid #e9ecef;
    border-radius: 12px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.3s ease;
    background: white;
    position: relative;
    
    &:hover {
      border-color: #a6c76c;
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.15);
    }
    
    &.selected {
      border-color: #a6c76c;
      background: linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%);
    }
    
    &.preview {
      margin-bottom: 0;
      
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        
        .preview-overlay {
          opacity: 1;
        }
      }
      
      .address-actions {
        display: none;
      }
    }
  }

  .preview-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(166, 199, 108, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    opacity: 0;
    transition: opacity 0.3s ease;
    
    .click-to-expand {
      color: white;
      font-weight: 600;
    }
  }

  .empty-state.preview {
    padding: 20px;
    text-align: center;
    background: #f8f9fa;
    border-radius: 12px;
    border: 2px dashed #dee2e6;
    
    p {
      margin-bottom: 16px;
      color: #6c757d;
    }
    
    .btn {
      margin: 0 auto;
    }
  }

  .address-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .address-type {
    font-weight: 600;
    color: #495057;
  }

  .address-radio {
    transform: scale(1.2);
  }

  .address-body {
    margin-bottom: 16px;
    
    .address-name {
      font-weight: 600;
      color: #212529;
      margin-bottom: 4px;
    }
    
    .address-contact {
      color: #6c757d;
      margin-bottom: 8px;
    }
    
    .address-text {
      color: #495057;
      line-height: 1.5;
      margin-bottom: 8px;
    }
    
    .address-pincode {
      color: #6c757d;
    }
  }

  .default-badge {
    background: #28a745;
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    display: inline-block;
    margin-top: 8px;
  }

  .address-actions {
    display: flex;
    gap: 8px;
    
    .btn {
      padding: 6px 12px;
      border-radius: 6px;
      transition: all 0.3s ease;
      
      &.btn-edit {
        background: #a6c76c;
        color: white;
        border: none;
        
        &:hover {
          background: #a6c76c;
        }
      }
      
      &.btn-delete {
        background: #dc3545;
        color: white;
        border: none;
        
        &:hover {
          background: #c82333;
        }
      }
    }
  }

  /* Payment Styles */
  .payment-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 20px;
    }
  }

  .payment-methods {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .payment-option {
    display: flex;
    align-items: flex-start;
    padding: 20px;
    border: 2px solid #e9ecef;
    border-radius: 12px;
    transition: all 0.3s ease;
    cursor: pointer;
    
    &:hover {
      border-color: #a6c76c;
      background: #f8f9ff;
    }
  }

  .payment-info {
    margin-left: 12px;
    display: flex;
    flex-direction: column;
    
    .payment-title {
      font-weight: 600;
      color: #212529;
      margin-bottom: 4px;
    }
    
    .payment-desc {
      color: #6c757d;
    }
  }

  .order-summary-card {
    background: #f8f9fa;
    padding: 24px;
    border-radius: 12px;
    border: 1px solid #e9ecef;
    
    h4 {
      margin-bottom: 20px;
      color: #212529;
      font-weight: 600;
    }
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    color: #495057;
    
    &.discount {
      color: #28a745;
      font-weight: 500;
    }
    
    &.total {
      font-size: 1.2rem;
      color: #212529;
    }
  }

  .summary-divider {
    height: 1px;
    background: #dee2e6;
    margin: 16px 0;
  }

  .coupon-info {
    background: #d4edda;
    padding: 8px 12px;
    border-radius: 6px;
    margin-top: 12px;
    border: 1px solid #c3e6cb;
    text-align: center;
  }

  .btn-checkout {
    width: 100%;
    background: linear-gradient(135deg, #a6c76c 0%, #5b8c2a 100%);
    color: white;
    border: none;
    padding: 15px 20px;
    font-weight: 600;
    border-radius: 10px;
    margin-top: 20px;
    transition: all 0.3s ease;
    
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    }
    
    &:disabled {
      background: #6c757d;
      cursor: not-allowed;
      transform: none;
    }
  }

  .warning-text {
    color: #dc3545;
    text-align: center;
    margin-top: 12px;
  }

  /* Order Items Styles */
  .order-items-table {
    .product-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .product-image {
      width: 50px;
      height: 50px;
      object-fit: cover;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }
    
    .product-name {
      font-weight: 500;
      color: #212529;
    }
    
    .table {
      margin-bottom: 0;
      
      th {
        background: #f8f9fa;
        border-bottom: 2px solid #dee2e6;
        font-weight: 600;
        color: #495057;
        padding: 15px 12px;
      }
      
      td {
        padding: 15px 12px;
        vertical-align: middle;
        border-color: #e9ecef;
      }
    }
  }

  .btn-outline {
    border: 2px solid #a6c76c;
    color: #a6c76c;
    background: white;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.3s ease;
    
    &:hover {
      background: #a6c76c;
      color: white;
      transform: translateY(-1px);
    }
  }

  .cursor-pointer {
    cursor: pointer;
  }

  .text-right {
    text-align: right;
  }

  @media (max-width: 768px) {
    .section-header {
      padding: 16px 20px;
    }
    
    .section-content {
      padding: 20px;
    }
    
    .address-grid {
      grid-template-columns: 1fr;
    }
    
    .payment-container {
      grid-template-columns: 1fr;
    }
    
    .address-actions {
      flex-direction: column;
      
      .btn {
        width: 100%;
      }
    }
    
    .order-items-table {
      .product-info {
        flex-direction: column;
        align-items: flex-start;
        text-align: left;
      }
    }
    
    .address-card.preview {
      .address-body {
        .address-text {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      }
    }
    
    .preview-overlay .click-to-expand {
      padding: 0 12px;
      text-align: center;
    }
  }
`;

export default Checkout