/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/img-redundant-alt */

import React, { useEffect, useState } from 'react'
import headerBg from "../../Assets/images/page-header-bg.jpg"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { getUserAddress, getUserProfile, setLoader } from '../../Database/Action/DashboardAction'
import Avatar from '../Components/Avatar'
import axios from "axios";
import { postHeaderWithToken, getHeaderWithoutToken } from '../../Database/ApiHeader';
import toast from 'react-hot-toast';
import { ExpandMore, ExpandLess, LocationOn, Edit, Delete, ShoppingBag, LocalShipping, CheckCircle, Home } from '@mui/icons-material';
import styled from "styled-components";
import moment from 'moment';

const Profile = () => {
    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();
    const { referPage } = location.state || {}
    const [profileState, setProfileState] = useState(referPage !== undefined ? 3 : 1);
    const addressList = useSelector((state) => state.DashboardReducer.userAddress);
    const userProfile = useSelector((state) => state.DashboardReducer.userProfile);

    const [userInfo, setUserInfo] = useState({
        name: userProfile?.profileInfo?.name,
        email: userProfile?.profileInfo?.email,
        contact: userProfile?.profileInfo?.contact,
        avatar: {}
    })

    const [expandedAddresses, setExpandedAddresses] = useState({});
    const [orders, setOrders] = useState([]);
    const [orderStatusTitles, setOrderStatusTitles] = useState([]);
    const [loading, setLoading] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const ORDERS_PER_PAGE = 2;

    // Pagination calculations
    const totalPages = Math.ceil(orders.length / ORDERS_PER_PAGE);
    const startIndex = (currentPage - 1) * ORDERS_PER_PAGE;
    const endIndex = startIndex + ORDERS_PER_PAGE;
    const currentOrders = orders.slice(startIndex, endIndex);

    // Handle page change
    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Fetch orders directly from API
    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                process.env.REACT_APP_BASE_URL + "getOrder",
                postHeaderWithToken
            );

            if (response.data.status === 200) {
                setOrders(response.data.info || []);
            } else {
                toast.error(response.data.message || "Failed to fetch orders");
                setOrders([]);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
            toast.error(error?.response?.data?.message || "Failed to fetch orders");
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch order status titles directly from API
    const fetchOrderStatusTitles = async () => {
        try {
            const response = await axios.get(
                process.env.REACT_APP_BASE_URL + "getOrderStatusTitle",
                getHeaderWithoutToken
            );

            if (response.data.status === 200) {
                setOrderStatusTitles(response.data.info || []);
            } else {
                console.error("Failed to fetch order status titles:", response.data.message);
                setOrderStatusTitles([]);
            }
        } catch (error) {
            console.error("Error fetching order status titles:", error);
            setOrderStatusTitles([]);
        }
    };

    const toggleAddress = (addressId) => {
        setExpandedAddresses(prev => ({
            ...prev,
            [addressId]: !prev[addressId]
        }));
    };

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

    // Map order status to tracking steps
    const getOrderStatusSteps = (status) => {
        const statusMap = {
            'Pending': 'confirmed',
            'Approved': 'confirmed',
            'Process': 'shipped',
            'Shipped': 'shipped',
            'Out for Delivery': 'out_for_delivery',
            'Delivered': 'delivered',
            'Completed': 'delivered',
            'Cancelled': 'cancelled'
        };

        const currentStatus = statusMap[status] || 'confirmed';
        
        const steps = [
            { key: 'confirmed', label: 'Order Confirmed', icon: '📋', completed: true },
            { key: 'shipped', label: 'Order Shipped', icon: '📦', completed: ['shipped', 'out_for_delivery', 'delivered'].includes(currentStatus) },
            { key: 'out_for_delivery', label: 'Out for Delivery', icon: '🚚', completed: ['out_for_delivery', 'delivered'].includes(currentStatus) },
            { key: 'delivered', label: 'Order Delivered', icon: '🏠', completed: currentStatus === 'delivered' }
        ];
        return { steps, currentStatus };
    };

    const getStatusColor = (status) => {
        // Find color from orderStatusTitles
        const statusObj = orderStatusTitles?.find(item => item.title === status);
        if (statusObj && statusObj.color) {
            return statusObj.color;
        }

        // Fallback colors
        const colors = {
            'Pending': '#17a2b8',
            'Approved': '#17a2b8',
            'Process': '#ffc107',
            'Shipped': '#ffc107',
            'Out for Delivery': '#fd7e14',
            'Delivered': '#28a745',
            'Completed': '#28a745',
            'Cancelled': '#dc3545'
        };
        return colors[status] || '#6c757d';
    };

    const getStatusIcon = (status) => {
        const icons = {
            'Pending': '⏳',
            'Approved': '✅',
            'Process': '📦',
            'Shipped': '🚚',
            'Out for Delivery': '🚚',
            'Delivered': '🏠',
            'Completed': '✅',
            'Cancelled': '❌'
        };
        return icons[status] || '📦';
    };

    // Calculate expected delivery date (order date + 10 days)
    const getExpectedDelivery = (orderDate) => {
        return moment(orderDate).add(10, 'days').format('MMM DD, YYYY');
    };

    // Get tracking ID (using order number or generating from order ID)
    const getTrackingId = (order) => {
        return order.trackingId || order.orderNumber?.replace('order_', '').substring(0, 8) || order.id.toString().padStart(8, '0');
    };

    // Handle Edit Address
const handleEditAddress = (address) => {
    console.log("Editing address:", address);

    navigate("/editAddress", { 
        state: { 
            addressData: address 
        } 
    });
   
    localStorage.setItem('editingAddress', JSON.stringify(address));
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

    const handleProfileChange = (e) => {
        setUserInfo({ ...userInfo, [e.target.name]: e.target.value })
    }

    const logout = () => {
        localStorage.removeItem("iottechUserInfo");
        navigate("/register");
        window.location.reload(false);
    }

    // Fetch orders and status titles when orders tab is active
    useEffect(() => {
        if (profileState === 2) {
            fetchOrders();
            fetchOrderStatusTitles();
        }
    }, [profileState]);

    // Reset to page 1 when orders change
    useEffect(() => {
        setCurrentPage(1);
    }, [orders]);

    useEffect(() => {
        setUserInfo({
            ...userInfo,
            name: userProfile?.profileInfo?.name,
            email: userProfile?.profileInfo?.email,
            contact: userProfile?.profileInfo?.contact,
        })
    }, [userProfile])

    useEffect(() => {
        dispatch(getUserAddress({ navigate: navigate }))
        dispatch(getUserProfile({ navigate: navigate }))
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
                            My Account<span>Shop</span>
                        </h1>
                    </div>
                </div>
                
                <nav aria-label="breadcrumb" className="breadcrumb-nav mb-3">
                    <div className="container">
                        <ol className="breadcrumb">
                            <li className="breadcrumb-item">
                                <a href="index.html">Home</a>
                            </li>
                            <li className="breadcrumb-item">
                                <a href="#">Shop</a>
                            </li>
                            <li className="breadcrumb-item active" aria-current="page">
                                My Account
                            </li>
                        </ol>
                    </div>
                </nav>

                <div className="page-content">
                    <div className="dashboard">
                        <div className="container">
                            <div className="row">
                                <aside className="col-md-4 col-lg-3">
                                    <ul
                                        className="nav nav-dashboard flex-column mb-3 mb-md-0"
                                        role="tablist"
                                    >
                                        <li className="nav-item">
                                            <a
                                                className={profileState === 1 ? "nav-link active cursor-pointer" : "nav-link cursor-pointer"}
                                                onClick={() => setProfileState(1)}
                                            >
                                                My Account
                                            </a>
                                        </li>
                                        <li className="nav-item">
                                            <a
                                                className={profileState === 2 ? "nav-link active cursor-pointer" : "nav-link cursor-pointer"}
                                                onClick={() => setProfileState(2)}
                                            >
                                                Orders
                                            </a>
                                        </li>
                                        <li className="nav-item">
                                            <a
                                                className={profileState === 3 ? "nav-link active cursor-pointer" : "nav-link cursor-pointer"}
                                                onClick={() => setProfileState(3)}
                                            >
                                                Addresses
                                            </a>
                                        </li>
                                        <li className="nav-item">
                                            <a
                                                className={profileState === 4 ? "nav-link active cursor-pointer" : "nav-link cursor-pointer"}
                                                onClick={() => setProfileState(4)}
                                            >
                                                Edit Profile
                                            </a>
                                        </li>
                                        <li className="nav-item">
                                            <a className={profileState === 5 ? "nav-link active cursor-pointer" : "nav-link cursor-pointer"}
                                                onClick={() => setProfileState(5)}
                                            >
                                                Sign Out
                                            </a>
                                        </li>
                                    </ul>
                                </aside>

                                <div className="col-md-8 col-lg-9">
                                    <div className="tab-content">
                                        {/* My Account Tab */}
                                        <div
                                            className={profileState === 1 ? "tab-pane fade show active" : "tab-pane fade"}
                                        >
                                            <div className="col-lg-8">
                                                <div className="card card-dashboard">
                                                    <div className="card-body">
                                                        <div className='flex items-center justify-center'>
                                                            <Avatar width={80} height={80} name={userProfile?.profileInfo?.name} imageUrl={""} />
                                                        </div>
                                                        <p className='text-center'>
                                                            Name : {userProfile?.profileInfo?.name}
                                                            <br />
                                                            Contact : {userProfile?.profileInfo?.contact}
                                                            <br />
                                                            Email : {userProfile?.profileInfo?.email}
                                                            <br />
                                                            <a href="#" onClick={() => setProfileState(4)}>
                                                                Edit <i className="icon-edit" />
                                                            </a>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Orders Tab - Updated with modern UI and pagination */}
                                        <div
                                            className={profileState === 2 ? "tab-pane fade show active" : "tab-pane fade"}
                                        >
                                            {loading ? (
                                                <div className="loading-state">
                                                    <div className="spinner-border text-primary" role="status">
                                                        <span className="sr-only">Loading...</span>
                                                    </div>
                                                    <p>Loading your orders...</p>
                                                </div>
                                            ) : !orders || orders.length === 0 ? (
                                                <div className="empty-orders">
                                                    <div className="empty-icon">
                                                        <ShoppingBag style={{ fontSize: '4rem' }} />
                                                    </div>
                                                    <h4>No orders yet</h4>
                                                    <p>You haven't placed any orders yet.</p>
                                                    <NavLink to="/shop" className="btn btn-primary">
                                                        <span>START SHOPPING</span>
                                                        <i className="icon-long-arrow-right" />
                                                    </NavLink>
                                                </div>
                                            ) : (
                                                <div className="orders-container">
                                                    <div className="orders-header">
                                                        <div className="header-content">
                                                            <h3 className="orders-title">My Orders</h3>
                                                            <p className="orders-subtitle">Track your order history and status</p>
                                                        </div>
                                                        <div className="orders-stats">
                                                            <div className="stat-item">
                                                                <span className="stat-number">{orders.length}</span>
                                                                <span className="stat-label">Total Orders</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="orders-grid">
                                                        {currentOrders.map((order) => {
                                                            const { steps, currentStatus } = getOrderStatusSteps(order.status || 'Pending');
                                                            const trackingId = getTrackingId(order);
                                                            const expectedDelivery = getExpectedDelivery(order.createdAt);
                                                            const isDelivered = order.status === 'Delivered' || order.status === 'Completed';
                                                            
                                                            return (
                                                                <div key={order.id} className="order-card-modern">
                                                                    {/* Order Header */}
                                                                    <div className="order-card-header">
                                                                        <div className="order-meta-info">
                                                                            <div className="order-badge-group">
                                                                                <span className="order-id-badge">
                                                                                    <i className="fas fa-receipt"></i>
                                                                                    ORDER #{order.orderNumber}
                                                                                </span>
                                                                                <span 
                                                                                    className="status-badge-modern"
                                                                                    style={{ 
                                                                                        backgroundColor: getStatusColor(order.status || 'Pending'),
                                                                                        color: 'white'
                                                                                    }}
                                                                                >
                                                                                    {getStatusIcon(order.status || 'Pending')} 
                                                                                    {order.status || 'Pending'}
                                                                                </span>
                                                                            </div>
                                                                            <div className="order-date-info">
                                                                                <span className="order-date">
                                                                                    <i className="fas fa-calendar"></i>
                                                                                    {moment(order.createdAt).format('MMM DD, YYYY')}
                                                                                </span>
                                                                                {!isDelivered && (
                                                                                    <span className="expected-delivery-modern">
                                                                                        <i className="fas fa-truck"></i>
                                                                                        Est. {expectedDelivery}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <div className="tracking-info">
                                                                            <span className="tracking-id-modern">
                                                                                <i className="fas fa-barcode"></i>
                                                                                Tracking: {trackingId}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Progress Tracker - Modern */}
                                                                    <div className="progress-tracker-modern">
                                                                        <div className="tracker-steps">
                                                                            {steps.map((step, index) => (
                                                                                <div key={step.key} className="tracker-step-container">
                                                                                    <div className={`tracker-step ${step.completed ? 'completed' : ''} ${step.key === currentStatus ? 'active' : ''}`}>
                                                                                        <div className="step-indicator">
                                                                                            {step.completed ? (
                                                                                                <CheckCircle className="step-icon-completed" />
                                                                                            ) : (
                                                                                                <div className="step-icon-pending">
                                                                                                    {step.icon}
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                        <div className="step-info">
                                                                                            <span className="step-label-modern">{step.label}</span>
                                                                                            {step.key === currentStatus && (
                                                                                                <span className="step-status-current">Current</span>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                    {index < steps.length - 1 && (
                                                                                        <div className={`tracker-connector ${step.completed ? 'completed' : ''}`}></div>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>

                                                                    {/* Order Summary - Modern */}
                                                                    <div className="order-summary-modern">
                                                                        <div className="summary-header">
                                                                            <h5>Order Summary</h5>
                                                                            <div className="total-amount-modern">
                                                                                ₹{order.totalAmount}
                                                                            </div>
                                                                        </div>
                                                                        
                                                                        <div className="summary-details">
                                                                            <div className="detail-row">
                                                                                <span className="detail-label">Items:</span>
                                                                                <span className="detail-value">{order.totalProduct} product(s)</span>
                                                                            </div>
                                                                            {order.shipping && order.shipping !== "0" && (
                                                                                <div className="detail-row">
                                                                                    <span className="detail-label">Shipping:</span>
                                                                                    <span className="detail-value">₹{order.shipping}</span>
                                                                                </div>
                                                                            )}
                                                                            {order.allTaxes && order.allTaxes !== "0" && (
                                                                                <div className="detail-row">
                                                                                    <span className="detail-label">Taxes:</span>
                                                                                    <span className="detail-value">₹{order.allTaxes}</span>
                                                                                </div>
                                                                            )}
                                                                            <div className="detail-row payment-info">
                                                                                <span className="detail-label">Payment:</span>
                                                                                <span className={`payment-badge ${order.paymentMode === '1' ? 'online' : 'cod'}`}>
                                                                                    {order.paymentMode === '1' ? 'Online' : 'COD'}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Shipping Address - Modern */}
                                                                    <div className="shipping-address-modern">
                                                                        <div className="address-header">
                                                                            <i className="fas fa-map-marker-alt"></i>
                                                                            <span>Shipping Address</span>
                                                                        </div>
                                                                        <div className="address-details-modern">
                                                                            <p className="address-name-modern">{order.name}</p>
                                                                            <p className="address-contact-modern">{order.contact}</p>
                                                                            <p className="address-full-modern">
                                                                                {order.address1}, {order.address2}
                                                                            </p>
                                                                            <p className="address-location-modern">
                                                                                {order.city}, {order.state} - {order.pincode}
                                                                            </p>
                                                                        </div>
                                                                    </div>

                                                                    {/* Action Buttons */}
                                                                    {/* <div className="order-actions">
                                                                        <button className="btn-action btn-track">
                                                                            <i className="fas fa-shipping-fast"></i>
                                                                            Track Order
                                                                        </button>
                                                                        <button className="btn-action btn-details">
                                                                            <i className="fas fa-eye"></i>
                                                                            View Details
                                                                        </button>
                                                                        {isDelivered && (
                                                                            <button className="btn-action btn-reorder">
                                                                                <i className="fas fa-redo"></i>
                                                                                Reorder
                                                                            </button>
                                                                        )}
                                                                    </div> */}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    {/* Pagination */}
                                                  {/* Pagination */}
{orders.length > ORDERS_PER_PAGE && (
    <div className="pagination-container">
        <div className="pagination-info">
            Showing {startIndex + 1}-{Math.min(endIndex, orders.length)} of {orders.length} orders
        </div>
        <div className="pagination-controls">
            <button 
                className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
            >
                <i className="fas fa-chevron-left"></i>
                Previous
            </button>
            
            <div className="pagination-numbers">
                {/* Show first page */}
                {currentPage > 2 && (
                    <button
                        className="pagination-number"
                        onClick={() => handlePageChange(1)}
                    >
                        1
                    </button>
                )}
                
                {/* Show ellipsis if needed */}
                {currentPage > 3 && (
                    <span className="pagination-ellipsis">...</span>
                )}
                
                {/* Show current page and neighbors */}
                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                    let pageNum;
                    if (currentPage <= 2) {
                        pageNum = i + 1;
                    } else if (currentPage >= totalPages - 1) {
                        pageNum = totalPages - 2 + i;
                    } else {
                        pageNum = currentPage - 1 + i;
                    }
                    
                    if (pageNum > 0 && pageNum <= totalPages) {
                        return (
                            <button
                                key={pageNum}
                                className={`pagination-number ${currentPage === pageNum ? 'active' : ''}`}
                                onClick={() => handlePageChange(pageNum)}
                            >
                                {pageNum}
                            </button>
                        );
                    }
                    return null;
                })}
                
                {/* Show ellipsis if needed */}
                {currentPage < totalPages - 2 && (
                    <span className="pagination-ellipsis">...</span>
                )}
                
                {/* Show last page if not already shown */}
                {currentPage < totalPages - 1 && totalPages > 3 && (
                    <button
                        className="pagination-number"
                        onClick={() => handlePageChange(totalPages)}
                    >
                        {totalPages}
                    </button>
                )}
            </div>
            
            <button 
                className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                Next
                <i className="fas fa-chevron-right"></i>
            </button>
        </div>
    </div>
)}
                                                </div>
                                            )}
                                        </div>

                                        {/* Addresses Tab */}
                                        <div
                                            className={profileState === 3 ? "tab-pane fade show active" : "tab-pane fade"}
                                        >
                                            <div className="addresses-header">
                                                <h3>My Addresses</h3>
                                                <p>Manage your delivery addresses</p>
                                            </div>

                                            {addressList.length === 0 ? (
                                                <div className="empty-state">
                                                    <div className="empty-icon">
                                                        <LocationOn />
                                                    </div>
                                                    <h4>No addresses found</h4>
                                                    <p>You haven't added any delivery addresses yet.</p>
                                                    <NavLink to="/addAddress" className="btn btn-primary">
                                                        <span>Add Your First Address</span>
                                                        <i className="icon-long-arrow-right" />
                                                    </NavLink>
                                                </div>
                                            ) : (
                                                <div className="addresses-container">
                                                    <div className="addresses-grid">
                                                        {addressList.map((item, index) => (
                                                            <div className="address-card" key={index}>
                                                                <div 
                                                                    className="address-header cursor-pointer"
                                                                    onClick={() => toggleAddress(item.id)}
                                                                >
                                                                    <div className="address-type-info">
                                                                        <span className="address-type-icon">
                                                                            {getAddressTypeIcon(item.addressType)}
                                                                        </span>
                                                                        <span className="address-type">
                                                                            {getAddressType(item.addressType)}
                                                                        </span>
                                                                        {item.defaultAddress === "true" && (
                                                                            <span className="default-badge">Default</span>
                                                                        )}
                                                                    </div>
                                                                    {expandedAddresses[item.id] ? <ExpandLess /> : <ExpandMore />}
                                                                </div>

                                                                {!expandedAddresses[item.id] && (
                                                                    <div className="address-preview">
                                                                        <p className="address-name">{item.name}</p>
                                                                        <p className="address-contact">{item.contact}</p>
                                                                        <p className="address-text-preview">
                                                                            {item.address1} {item.address2}
                                                                        </p>
                                                                        <div className="preview-overlay" onClick={() => toggleAddress(item.id)}>
                                                                            <span className="click-to-expand">Click to view details</span>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {expandedAddresses[item.id] && (
                                                                    <div className="address-details">
                                                                        <div className="address-body">
                                                                            <p className="address-name">{item.name}</p>
                                                                            <p className="address-contact">{item.contact}</p>
                                                                            <p className="address-text">
                                                                                {item.address1} {item.address2}
                                                                            </p>
                                                                            <p className="address-pincode">Pincode: {item.pincode}</p>
                                                                        </div>
                                                                        <div className="address-actions">
                                                                            <button
                                                                                className="btn btn-edit"
                                                                                onClick={() => handleEditAddress(item)}
                                                                            >
                                                                                <Edit className="btn-icon" />
                                                                                Edit
                                                                            </button>
                                                                            <button
                                                                                className="btn btn-delete"
                                                                                onClick={() => handleDeleteAddress(item.id)}
                                                                            >
                                                                                <Delete className="btn-icon" />
                                                                                Delete
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    
                                                    <div className="text-center mt-4">
                                                        <NavLink to="/addAddress" className="btn btn-outline">
                                                            <i className="icon-plus" />
                                                            Add New Address
                                                        </NavLink>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Edit Profile Tab */}
                                        <div
                                            className={profileState === 4 ? "tab-pane fade show active" : "tab-pane fade"}
                                        >
                                            <div className="edit-profile-card">
                                                <div className="card-body">
                                                    <h3 className="card-title">Edit Profile</h3>
                                                    <div className="form-group">
                                                        <label>Name *</label>
                                                        <input
                                                            type="text"
                                                            name='name'
                                                            className="form-control"
                                                            value={userInfo.name}
                                                            onChange={handleProfileChange}
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Email *</label>
                                                        <input
                                                            type="text"
                                                            name='email'
                                                            className="form-control"
                                                            value={userInfo.email}
                                                            onChange={handleProfileChange}
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Contact *</label>
                                                        <input
                                                            type="text"
                                                            name='contact'
                                                            className="form-control"
                                                            value={userInfo.contact}
                                                            onChange={handleProfileChange}
                                                        />
                                                    </div>

                                                    <button type="submit" className="btn btn-primary">
                                                        <span>SAVE CHANGES</span>
                                                        <i className="icon-long-arrow-right" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Logout Tab */}
                                        <div
                                            className={profileState === 5 ? "tab-pane fade show active" : "tab-pane fade"}
                                        >
                                            <div className="logout-card">
                                                <div className="card-body text-center">
                                                    <h3>Ready to Leave?</h3>
                                                    <p>You can always log back in anytime.</p>
                                                    <button className="btn btn-logout" onClick={logout}>
                                                        <span>Logout</span>
                                                        <i className="icon-long-arrow-right" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </Wrapper>
    )
}

const Wrapper = styled.section`
  .dashboard {
    .nav-dashboard {
      .nav-link {
        padding: 12px 16px;
        border-radius: 8px;
        margin-bottom: 8px;
        transition: all 0.3s ease;
        color: #495057;
        font-weight: 500;
        
        &:hover {
          background: #f8f9fa;
          color: #a6c76c;
        }
        
        &.active {
          background: linear-gradient(135deg, #a6c76c 0%, #7aa33a 100%);
          color: white;
        }
      }
    }
  }

  /* Loading State */
  .loading-state {
    text-align: center;
    padding: 60px 20px;
    
    .spinner-border {
      width: 3rem;
      height: 3rem;
      margin-bottom: 20px;
    }
    
    p {
      color: #6c757d;
      font-size: 1.1rem;
    }
  }

  /* Empty Orders */
  .empty-orders {
    text-align: center;
    padding: 60px 20px;
    
    .empty-icon {
      color: #dee2e6;
      margin-bottom: 20px;
    }
    
    h4 {
      color: #495057;
      margin-bottom: 12px;
      font-weight: 600;
    }
    
    p {
      color: #6c757d;
      margin-bottom: 30px;
      font-size: 1.1rem;
    }
  }

  /* Orders Header */
  .orders-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 2px solid #f0f0f0;
    
    @media (max-width: 768px) {
      flex-direction: column;
      align-items: flex-start;
      gap: 15px;
    }
  }

  .header-content {
    .orders-title {
      color: #2c3e50;
      font-weight: 700;
      margin-bottom: 8px;
      font-size: 1.8rem;
    }
    
    .orders-subtitle {
      color: #7f8c8d;
      margin: 0;
      font-size: 1rem;
    }
  }

  .orders-stats {
    .stat-item {
      text-align: center;
      padding: 15px 20px;
      background: linear-gradient(135deg, #a6c76c 0%, #7aa33a 100%);
      border-radius: 12px;
      color: white;
      
      .stat-number {
        display: block;
        font-size: 2rem;
        font-weight: 700;
        line-height: 1;
      }
      
      .stat-label {
        font-size: 0.9rem;
        opacity: 0.9;
      }
    }
  }

  /* Orders Grid */
  .orders-grid {
    display: flex;
    flex-direction: column;
    gap: 25px;
    margin-bottom: 40px;
  }

  /* Modern Order Card */
  .order-card-modern {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 25px rgba(0, 0, 0, 0.08);
    padding: 0;
    overflow: hidden;
    border: 1px solid #e8ecef;
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 35px rgba(0, 0, 0, 0.15);
    }
  }

  /* Order Header */
  .order-card-header {
    background: linear-gradient(135deg, #f8fafc 0%, #e8f0fe 100%);
    padding: 24px;
    border-bottom: 1px solid #e8ecef;
  }

  .order-meta-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    
    @media (max-width: 768px) {
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;
    }
  }

  .order-badge-group {
    display: flex;
    align-items: center;
    gap: 12px;
    
    @media (max-width: 576px) {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }
  }

  .order-id-badge {
    background: #2c3e50;
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
    
    i {
      margin-right: 6px;
    }
  }

  .status-badge-modern {
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    
    i {
      margin-right: 6px;
    }
  }

  .order-date-info {
    display: flex;
    gap: 15px;
    font-size: 0.9rem;
    color: #64748b;
    
    @media (max-width: 576px) {
      flex-direction: column;
      gap: 5px;
    }
    
    i {
      margin-right: 6px;
      color: #a6c76c;
    }
  }

  .expected-delivery-modern {
    color: #e67e22;
    font-weight: 600;
  }

  .tracking-info {
    .tracking-id-modern {
      background: white;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #2c3e50;
      border: 1px solid #e8ecef;
      
      i {
        margin-right: 6px;
        color: #a6c76c;
      }
    }
  }

  /* Modern Progress Tracker */
  .progress-tracker-modern {
    padding: 30px 24px;
    background: white;
  }

  .tracker-steps {
    display: flex;
    justify-content: space-between;
    position: relative;
  }

  .tracker-step-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    position: relative;
  }

  .tracker-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    position: relative;
    z-index: 2;
    
    &.active .step-indicator {
      transform: scale(1.1);
      box-shadow: 0 0 0 4px rgba(166, 199, 108, 0.3);
    }
    
    &.completed .step-indicator {
      background: #28a745;
    }
  }

  .step-indicator {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: #e9ecef;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
    transition: all 0.3s ease;
    border: 3px solid white;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  .step-icon-completed {
    font-size: 1.8rem !important;
    color: white;
  }

  .step-icon-pending {
    font-size: 1.4rem;
  }

  .step-info {
    .step-label-modern {
      display: block;
      font-weight: 600;
      color: #2c3e50;
      font-size: 0.9rem;
      margin-bottom: 4px;
    }
    
    .step-status-current {
      font-size: 0.75rem;
      color: #a6c76c;
      font-weight: 600;
      text-transform: uppercase;
    }
  }

  .tracker-connector {
    position: absolute;
    top: 30px;
    left: 50%;
    right: -50%;
    height: 3px;
    background: #e9ecef;
    z-index: 1;
    
    &.completed {
      background: #28a745;
    }
  }

  /* Modern Order Summary */
  .order-summary-modern {
    padding: 24px;
    background: #f8fafc;
    border-top: 1px solid #e8ecef;
  }

  .summary-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    h5 {
      color: #2c3e50;
      margin: 0;
      font-weight: 600;
    }
  }

  .total-amount-modern {
    font-size: 1.5rem;
    font-weight: 700;
    color: #a6c76c;
  }

  .summary-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    
    &.payment-info {
      border-top: 1px dashed #e8ecef;
      padding-top: 12px;
      margin-top: 4px;
    }
  }

  .detail-label {
    color: #64748b;
    font-weight: 500;
  }

  .detail-value {
    color: #2c3e50;
    font-weight: 600;
  }

  .payment-badge {
    padding: 4px 12px;
    border-radius: 15px;
    font-size: 0.8rem;
    font-weight: 600;
    
    &.online {
      background: #d4edda;
      color: #155724;
    }
    
    &.cod {
      background: #fff3cd;
      color: #856404;
    }
  }

  /* Modern Shipping Address */
  .shipping-address-modern {
    padding: 24px;
    border-top: 1px solid #e8ecef;
  }

  .address-header {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
    
    i {
      color: #a6c76c;
      margin-right: 10px;
      font-size: 1.1rem;
    }
    
    span {
      font-weight: 600;
      color: #2c3e50;
    }
  }

  .address-details-modern {
    .address-name-modern {
      font-weight: 700;
      color: #2c3e50;
      margin-bottom: 4px;
      font-size: 1.1rem;
    }
    
    .address-contact-modern {
      color: #64748b;
      margin-bottom: 8px;
    }
    
    .address-full-modern {
      color: #2c3e50;
      margin-bottom: 4px;
      line-height: 1.4;
    }
    
    .address-location-modern {
      color: #64748b;
      font-size: 0.9rem;
    }
  }

  /* Order Actions */
  .order-actions {
    display: flex;
    gap: 12px;
    padding: 20px 24px;
    background: #f8fafc;
    border-top: 1px solid #e8ecef;
    
    @media (max-width: 576px) {
      flex-direction: column;
    }
  }

  .btn-action {
    flex: 1;
    padding: 12px 20px;
    border: 2px solid #e8ecef;
    border-radius: 10px;
    background: white;
    color: #2c3e50;
    font-weight: 600;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }
    
    &.btn-track {
      border-color: #a6c76c;
      color: #a6c76c;
      
      &:hover {
        background: #a6c76c;
        color: white;
      }
    }
    
    &.btn-details {
      border-color: #3498db;
      color: #3498db;
      
      &:hover {
        background: #3498db;
        color: white;
      }
    }
    
    &.btn-reorder {
      border-color: #e67e22;
      color: #e67e22;
      
      &:hover {
        background: #e67e22;
        color: white;
      }
    }
  }

  /* Pagination */
  .pagination-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 40px;
    padding: 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 15px rgba(0, 0, 0, 0.08);
    
    @media (max-width: 768px) {
      flex-direction: column;
      gap: 15px;
    }
  }

  .pagination-info {
    color: #64748b;
    font-weight: 500;
  }

  .pagination-controls {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .pagination-btn {
    padding: 10px 20px;
    border: 2px solid #e8ecef;
    background: white;
    color: #2c3e50;
    border-radius: 8px;
    font-weight: 600;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    
    &:hover:not(.disabled) {
      border-color: #a6c76c;
      color: #a6c76c;
      transform: translateY(-1px);
    }
    
    &.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .pagination-numbers {
    display: flex;
    gap: 5px;
  }

  .pagination-number {
    width: 40px;
    height: 40px;
    border: 2px solid #e8ecef;
    background: white;
    color: #2c3e50;
    border-radius: 8px;
    font-weight: 600;
    transition: all 0.3s ease;
    
    &:hover {
      border-color: #a6c76c;
      color: #a6c76c;
    }
    
    &.active {
      background: #a6c76c;
      border-color: #a6c76c;
      color: white;
    }
  }

  /* Addresses Section Styles */
  .addresses-header {
    margin-bottom: 30px;
    
    h3 {
      color: #212529;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    p {
      color: #6c757d;
      margin: 0;
    }
  }

  .empty-state {
    text-align: center;
    padding: 60px 20px;
    
    .empty-icon {
      font-size: 4rem;
      color: #dee2e6;
      margin-bottom: 20px;
    }
    
    h4 {
      color: #495057;
      margin-bottom: 12px;
      font-weight: 600;
    }
    
    p {
      color: #6c757d;
      margin-bottom: 30px;
      font-size: 1.1rem;
    }
  }

  .addresses-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
  }

  .address-card {
    background: white;
    border: 1px solid #e9ecef;
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s ease;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
    
    &:hover {
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
      transform: translateY(-2px);
    }
  }

  .address-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border-bottom: 1px solid #dee2e6;
  }

  .address-type-info {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .address-type-icon {
    font-size: 1.2rem;
  }

  .address-type {
    font-weight: 600;
    color: #495057;
  }

  .default-badge {
    background: #28a745;
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    margin-left: 8px;
  }

  .address-preview {
    padding: 20px;
    position: relative;
    cursor: pointer;
    
    .address-name {
      font-weight: 600;
      color: #212529;
      margin-bottom: 4px;
    }
    
    .address-contact {
      color: #6c757d;
      margin-bottom: 8px;
      font-size: 0.9rem;
    }
    
    .address-text-preview {
      color: #495057;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
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
    opacity: 0;
    transition: opacity 0.3s ease;
    border-radius: 0 0 12px 12px;
    
    .click-to-expand {
      color: white;
      font-weight: 600;
    }
  }

  .address-preview:hover .preview-overlay {
    opacity: 1;
  }

  .address-details {
    padding: 20px;
  }

  .address-body {
    margin-bottom: 20px;
    
    .address-name {
      font-weight: 600;
      color: #212529;
      margin-bottom: 8px;
      font-size: 1.1rem;
    }
    
    .address-contact {
      color: #6c757d;
      margin-bottom: 12px;
    }
    
    .address-text {
      color: #495057;
      line-height: 1.5;
      margin-bottom: 8px;
    }
    
    .address-pincode {
      color: #6c757d;
      font-size: 0.9rem;
    }
  }

  .address-actions {
    display: flex;
    gap: 10px;
    
    .btn {
      flex: 1;
      padding: 10px 16px;
      border-radius: 8px;
      font-weight: 500;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      
      &.btn-edit {
        background: #a6c76c;
        color: white;
        border: none;
        
        &:hover {
          background: #7aa33a;
          transform: translateY(-1px);
        }
      }
      
      &.btn-delete {
        background: #dc3545;
        color: white;
        border: none;
        
        &:hover {
          background: #c82333;
          transform: translateY(-1px);
        }
      }
    }
    
    .btn-icon {
      font-size: 1rem !important;
    }
  }

  .edit-profile-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    
    .card-body {
      padding: 30px;
    }
    
    .card-title {
      color: #212529;
      font-weight: 600;
      margin-bottom: 25px;
      font-size: 1.5rem;
    }
    
    .form-group {
      margin-bottom: 20px;
      
      label {
        font-weight: 600;
        color: #495057;
        margin-bottom: 8px;
        display: block;
      }
      
      .form-control {
        border: 2px solid #e9ecef;
        border-radius: 8px;
        padding: 12px 16px;
        transition: all 0.3s ease;
        
        &:focus {
          border-color: #a6c76c;
          box-shadow: 0 0 0 0.2rem rgba(166, 199, 108, 0.25);
        }
      }
    }
  }

  .logout-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    
    .card-body {
      padding: 60px 40px;
    }
    
    h3 {
      color: #212529;
      font-weight: 600;
      margin-bottom: 12px;
    }
    
    p {
      color: #6c757d;
      margin-bottom: 30px;
      font-size: 1.1rem;
    }
  }

  .btn {
    &.btn-primary {
      background: linear-gradient(135deg, #a6c76c 0%, #7aa33a 100%);
      border: none;
      color: white;
      padding: 12px 30px;
      border-radius: 8px;
      font-weight: 600;
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(166, 199, 108, 0.4);
      }
    }
    
    &.btn-outline {
      border: 2px solid #a6c76c;
      color: #a6c76c;
      background: white;
      padding: 10px 24px;
      border-radius: 8px;
      font-weight: 500;
      transition: all 0.3s ease;
      
      &:hover {
        background: #a6c76c;
        color: white;
        transform: translateY(-1px);
      }
    }
    
    &.btn-logout {
      background: #dc3545;
      border: none;
      color: white;
      padding: 12px 30px;
      border-radius: 8px;
      font-weight: 600;
      transition: all 0.3s ease;
      
      &:hover {
        background: #c82333;
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(220, 53, 69, 0.4);
      }
    }
  }

  .cursor-pointer {
    cursor: pointer;
  }

  .text-center {
    text-align: center;
  }

  @media (max-width: 768px) {
    .addresses-grid {
      grid-template-columns: 1fr;
    }
    
    .address-actions {
      flex-direction: column;
    }
    
    .edit-profile-card .card-body {
      padding: 20px;
    }
    
    .logout-card .card-body {
      padding: 40px 20px;
    }
    
    .progress-steps {
      flex-direction: column;
      gap: 20px;
    }
    
    .connector {
      display: none;
    }
  }
`;

export default Profile