import React, { useEffect, useState } from 'react'
import styled from "styled-components"
import headerBg from "../../Assets/images/page-header-bg.jpg"
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import { useDispatch, useSelector } from "react-redux"
import { getCountry, getState, setLoader, getUserAddress } from '../../Database/Action/DashboardAction';
import isEmpty from "lodash.isempty"
import toast from "react-hot-toast"
import axios from "axios"
import { postHeaderWithToken } from "../../Database/ApiHeader"
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Business, LocationOn, ArrowBack, Save } from '@mui/icons-material';

const EditAddress = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    
    const countryList = useSelector((state) => state.DashboardReducer.countryList);
    const stateList = useSelector((state) => state.DashboardReducer.stateList);
    
    const [stateData, setStateData] = useState([{ name: "Select State" }]);
    const [countryData, setCountryData] = useState([{ name: "Select Country" }]);
    const [loading, setLoading] = useState(false);

    // Get address data from navigation state or try to get from localStorage as fallback
    const getAddressData = () => {
        if (location.state?.addressData) {
            console.log("Address data from navigation:", location.state.addressData);
            return location.state.addressData;
        }
        
        // Fallback: try to get from localStorage or sessionStorage
        const storedAddress = localStorage.getItem('editingAddress') || sessionStorage.getItem('editingAddress');
        if (storedAddress) {
            try {
                return JSON.parse(storedAddress);
            } catch (error) {
                console.error("Error parsing stored address:", error);
            }
        }
        
        return null;
    };

    const addressData = getAddressData();

    // Split name into first and last name safely
    const getFirstName = () => {
        if (addressData?.name) {
            const nameParts = addressData.name.split(" ");
            return nameParts[0] || "";
        }
        return "";
    };

    const getLastName = () => {
        if (addressData?.name) {
            const nameParts = addressData.name.split(" ");
            return nameParts.slice(1).join(" ") || "";
        }
        return "";
    };

    // Initialize form state
    const [addressInfo, setAddressInfo] = useState({
        addressId: "",
        fName: "",
        lName: "",
        email: "",
        contact: "",
        optional_contact: "",
        address1: "",
        address2: "",
        pincode: "",
        city: "",
        state: "",
        country: "",
        defaultAddress: "false",
        addressType: "0"
    });

    // Initialize form data when addressData is available
    useEffect(() => {
        if (addressData) {
            console.log("Initializing form with address data:", addressData);
            
            const firstName = getFirstName();
            const lastName = getLastName();
            
            setAddressInfo({
                addressId: addressData.id || addressData.addressId || "",
                fName: firstName,
                lName: lastName,
                email: addressData.email || "",
                contact: addressData.contact || "",
                optional_contact: addressData.optional_contact || "",
                address1: addressData.address1 || "",
                address2: addressData.address2 || "",
                pincode: addressData.pincode || "",
                city: addressData.city || "",
                state: addressData.state || "",
                country: addressData.country || "101", // Default to India
                defaultAddress: addressData.defaultAddress?.toString() || "false",
                addressType: addressData.addressType?.toString() || "0"
            });

            // Store in localStorage as backup
            localStorage.setItem('editingAddress', JSON.stringify(addressData));
        }
    }, [addressData]);

    // Load countries and states
    useEffect(() => {
        dispatch(getCountry());
        dispatch(getState());
    }, [dispatch]);

    // Update country data when countryList changes
    useEffect(() => {
        if (countryList && countryList.length > 0) {
            setCountryData([{ id: "", name: "Select Country" }].concat(countryList));
        }
    }, [countryList]);

    // Update state data based on selected country
    useEffect(() => {
        if (addressInfo.country && stateList && stateList.length > 0) {
            const filteredStates = stateList.filter((item) => 
                item.country_id === parseInt(addressInfo.country)
            );
            setStateData([{ name: "Select State" }].concat(filteredStates));
        } else {
            setStateData([{ name: "Select State" }]);
        }
    }, [addressInfo.country, stateList]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setAddressInfo(prev => ({
            ...prev,
            [name]: value
        }));
    }

    const getStateList = (countryId) => {
        setAddressInfo(prev => ({
            ...prev,
            country: countryId,
            state: "" // Reset state when country changes
        }));
    }

    const validateForm = () => {
        const errors = [];
        
        if (isEmpty(addressInfo.fName?.trim())) errors.push("First Name is required");
        if (isEmpty(addressInfo.lName?.trim())) errors.push("Last Name is required");
        if (isEmpty(addressInfo.contact?.trim())) errors.push("Contact number is required");
        if (isEmpty(addressInfo.email?.trim())) errors.push("Email is required");
        if (isEmpty(addressInfo.address1?.trim())) errors.push("Address Line 1 is required");
        if (isEmpty(addressInfo.pincode?.trim())) errors.push("Pincode is required");
        if (isEmpty(addressInfo.city?.trim())) errors.push("City is required");
        if (isEmpty(addressInfo.state?.trim()) || addressInfo.state === "Select State") errors.push("State is required");
        if (isEmpty(addressInfo.country?.trim()) || addressInfo.country === "") errors.push("Country is required");
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (addressInfo.email && !emailRegex.test(addressInfo.email)) {
            errors.push("Please enter a valid email address");
        }
        
        // Contact validation
        const contactRegex = /^[0-9]{10}$/;
        if (addressInfo.contact && !contactRegex.test(addressInfo.contact)) {
            errors.push("Contact number must be 10 digits");
        }

        return errors;
    }

    const updateAddress = async () => {
        const validationErrors = validateForm();
        
        if (validationErrors.length > 0) {
            validationErrors.forEach(error => toast.error(error));
            return;
        }

        setLoading(true);
        dispatch(setLoader(true));
        
        const updateData = {
            addressId: addressInfo.addressId,
            fName: addressInfo.fName.trim(),
            lName: addressInfo.lName.trim(),
            email: addressInfo.email.trim(),
            contact: addressInfo.contact.trim(),
            optional_contact: addressInfo.optional_contact?.trim() || "",
            address1: addressInfo.address1.trim(),
            address2: addressInfo.address2?.trim() || "",
            pincode: addressInfo.pincode.trim(),
            city: addressInfo.city.trim(),
            state: addressInfo.state,
            country: addressInfo.country,
            defaultAddress: addressInfo.defaultAddress,
            addressType: addressInfo.addressType
        };

        console.log("Sending update data:", updateData);

        try {
            const response = await axios.post(
                process.env.REACT_APP_BASE_URL + "updateAddress", 
                updateData, 
                postHeaderWithToken
            );
            
            dispatch(setLoader(false));
            setLoading(false);
            
            if (response.data.status === 200) {
                toast.success("Address updated successfully!");
                dispatch(getUserAddress({ navigate: navigate }));
                // Clean up stored address
                localStorage.removeItem('editingAddress');
                sessionStorage.removeItem('editingAddress');
                navigate("/profile", { state: { referPage: 3 } });
            } else {
                toast.error(response.data.message || "Failed to update address");
            }
        } catch (error) {
            console.error("Update address error:", error);
            dispatch(setLoader(false));
            setLoading(false);
            toast.error(error?.response?.data?.message || error.message || "Failed to update address");
        }
    }

    // Redirect if no address data
    useEffect(() => {
        if (!addressData) {
            toast.error("No address data found. Redirecting...");
            const timer = setTimeout(() => {
                navigate("/profile", { state: { referPage: 3 } });
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [addressData, navigate]);

    if (!addressData) {
        return (
            <Wrapper>
                <div className="loading-container">
                    <div className="spinner-border text-primary" role="status">
                        <span className="sr-only">Loading...</span>
                    </div>
                    <p>No address data found. Redirecting...</p>
                </div>
            </Wrapper>
        );
    }

    return (
        <Wrapper>
            <main className="main">
                <nav aria-label="breadcrumb" className="breadcrumb-nav border-0 mb-0">
                    <div className="container">
                        <ol className="breadcrumb">
                            <li className="breadcrumb-item">
                                <a onClick={() => navigate("/")}>Home</a>
                            </li>
                            <li className="breadcrumb-item">
                                <a onClick={() => navigate("/profile")}>Profile</a>
                            </li>
                            <li className="breadcrumb-item active" aria-current="page">
                                Edit Address
                            </li>
                        </ol>
                    </div>
                </nav>
                
                <div className="page-header text-center" style={{ backgroundImage: `url(${headerBg})` }}>
                    <div className="container">
                        <h1 className="page-title">
                            Edit <span>Address</span>
                        </h1>
                    </div>
                </div>
                
                <div className='page-content pb-0'>
                    <div className="container">
                        <div className="edit-address-card">
                            <div className="card-header">
                                <h2>Edit Delivery Address</h2>
                                <p>Update your address information below</p>
                            </div>
                            
                            <div className="card-body">
                                <form onSubmit={(e) => { e.preventDefault(); updateAddress(); }}>
                                    {/* Personal Information Section */}
                                    <div className="form-section">
                                        <h4 className="section-title">
                                            <span className="section-icon">👤</span>
                                            Personal Information
                                        </h4>
                                        <div className="row">
                                            <div className="col-sm-6">
                                                <div className="form-group">
                                                    <label>First Name *</label>
                                                    <input 
                                                        type="text" 
                                                        name="fName" 
                                                        className="form-control" 
                                                        value={addressInfo.fName} 
                                                        onChange={handleInputChange}
                                                        placeholder="Enter first name"
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-sm-6">
                                                <div className="form-group">
                                                    <label>Last Name *</label>
                                                    <input 
                                                        type="text" 
                                                        name="lName" 
                                                        className="form-control" 
                                                        value={addressInfo.lName} 
                                                        onChange={handleInputChange}
                                                        placeholder="Enter last name"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col-sm-6">
                                                <div className="form-group">
                                                    <label>Contact Number *</label>
                                                    <input 
                                                        type="tel" 
                                                        name="contact" 
                                                        className="form-control" 
                                                        value={addressInfo.contact} 
                                                        onChange={handleInputChange}
                                                        placeholder="10-digit mobile number"
                                                        maxLength="10"
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-sm-6">
                                                <div className="form-group">
                                                    <label>Alternative Contact (Optional)</label>
                                                    <input 
                                                        type="tel" 
                                                        name="optional_contact" 
                                                        className="form-control" 
                                                        value={addressInfo.optional_contact} 
                                                        onChange={handleInputChange}
                                                        placeholder="Alternative contact number"
                                                        maxLength="10"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label>Email Address *</label>
                                            <input 
                                                type="email" 
                                                name='email' 
                                                className="form-control" 
                                                value={addressInfo.email} 
                                                onChange={handleInputChange}
                                                placeholder="your@email.com"
                                            />
                                        </div>
                                    </div>

                                    {/* Address Information Section */}
                                    <div className="form-section">
                                        <h4 className="section-title">
                                            <span className="section-icon">📍</span>
                                            Address Information
                                        </h4>
                                        <div className="form-group">
                                            <label>Address Line 1 *</label>
                                            <input 
                                                type="text" 
                                                name='address1' 
                                                className="form-control" 
                                                value={addressInfo.address1} 
                                                onChange={handleInputChange}
                                                placeholder="House/Flat number, Street name"
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Address Line 2 (Optional)</label>
                                            <input 
                                                type="text" 
                                                name="address2" 
                                                className="form-control" 
                                                value={addressInfo.address2} 
                                                onChange={handleInputChange}
                                                placeholder="Area, Landmark, etc."
                                            />
                                        </div>

                                        <div className="row">
                                            <div className="col-sm-6">
                                                <div className="form-group">
                                                    <label>City *</label>
                                                    <input 
                                                        type="text" 
                                                        name='city' 
                                                        className="form-control" 
                                                        value={addressInfo.city} 
                                                        onChange={handleInputChange}
                                                        placeholder="Enter city"
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-sm-6">
                                                <div className="form-group">
                                                    <label>Pincode *</label>
                                                    <input 
                                                        type="text" 
                                                        name='pincode' 
                                                        className="form-control" 
                                                        value={addressInfo.pincode} 
                                                        onChange={handleInputChange}
                                                        placeholder="6-digit pincode"
                                                        maxLength="6"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row">
                                            <div className="col-sm-6">
                                                <div className="form-group">
                                                    <label>Country *</label>
                                                    <select
                                                        className="form-control"
                                                        value={addressInfo.country}
                                                        onChange={(e) => getStateList(e.target.value)}
                                                    >
                                                        {countryData?.map((currElem, index) => (
                                                            <option key={index} value={currElem.id}>
                                                                {currElem.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="col-sm-6">
                                                <div className="form-group">
                                                    <label>State *</label>
                                                    <select
                                                        className="form-control"
                                                        value={addressInfo.state}
                                                        onChange={(e) => setAddressInfo({ ...addressInfo, state: e.target.value })}
                                                    >
                                                        {stateData?.map((currElem, index) => (
                                                            <option key={index} value={currElem.name}>
                                                                {currElem.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Address Preferences Section */}
                                    <div className="form-section">
                                        <h4 className="section-title">
                                            <span className="section-icon">⚙️</span>
                                            Address Preferences
                                        </h4>
                                        <div className="row">
                                            <div className="col-sm-6">
                                                <FormControl component="fieldset">
                                                    <FormLabel component="legend">Address Type</FormLabel>
                                                    <RadioGroup
                                                        row
                                                        name="addressType"
                                                        value={addressInfo.addressType}
                                                        onChange={(e) => setAddressInfo({ ...addressInfo, addressType: e.target.value })}
                                                    >
                                                        <FormControlLabel 
                                                            value="0" 
                                                            control={<Radio size='large' />} 
                                                            label={
                                                                <div className="radio-label">
                                                                    <Home className="radio-icon" />
                                                                    Home
                                                                </div>
                                                            } 
                                                        />
                                                        <FormControlLabel 
                                                            value="1" 
                                                            control={<Radio size='large' />} 
                                                            label={
                                                                <div className="radio-label">
                                                                    <Business className="radio-icon" />
                                                                    Work
                                                                </div>
                                                            } 
                                                        />
                                                        <FormControlLabel 
                                                            value="2" 
                                                            control={<Radio size='large' />} 
                                                            label={
                                                                <div className="radio-label">
                                                                    <LocationOn className="radio-icon" />
                                                                    Other
                                                                </div>
                                                            } 
                                                        />
                                                    </RadioGroup>
                                                </FormControl>
                                            </div>
                                            <div className="col-sm-6">
                                                <FormControl component="fieldset">
                                                    <FormLabel component="legend">Set as Default Address</FormLabel>
                                                    <RadioGroup
                                                        row
                                                        name="defaultAddress"
                                                        value={addressInfo.defaultAddress}
                                                        onChange={(e) => setAddressInfo({ ...addressInfo, defaultAddress: e.target.value })}
                                                    >
                                                        <FormControlLabel 
                                                            value="true" 
                                                            control={<Radio size='large' />} 
                                                            label="Yes" 
                                                        />
                                                        <FormControlLabel 
                                                            value="false" 
                                                            control={<Radio size='large' />} 
                                                            label="No" 
                                                        />
                                                    </RadioGroup>
                                                </FormControl>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="form-actions">
                                        <button 
                                            type="button" 
                                            className="btn btn-back"
                                            onClick={() => navigate("/profile", { state: { referPage: 3 } })}
                                            disabled={loading}
                                        >
                                            <ArrowBack className="btn-icon" />
                                            Back to Profile
                                        </button>
                                        <button 
                                            type="submit" 
                                            className="btn btn-primary"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <div className="spinner-border spinner-border-sm me-2" role="status">
                                                        <span className="sr-only">Loading...</span>
                                                    </div>
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="btn-icon" />
                                                    Update Address
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </Wrapper>
    )
}

const Wrapper = styled.section`
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 100px 20px;
    text-align: center;
    
    p {
      margin-top: 20px;
      color: #6c757d;
      font-size: 1.1rem;
    }
  }

  .edit-address-card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 25px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    margin: 30px auto;
    max-width: 800px;
  }

  .card-header {
    background: linear-gradient(135deg, #a6c76c 0%, #7aa33a 100%);
    color: white;
    padding: 30px;
    text-align: center;
    
    h2 {
      margin: 0 0 8px 0;
      font-weight: 700;
      font-size: 1.8rem;
    }
    
    p {
      margin: 0;
      opacity: 0.9;
      font-size: 1.1rem;
    }
  }

  .card-body {
    padding: 40px;
    
    @media (max-width: 768px) {
      padding: 25px;
    }
  }

  .form-section {
    margin-bottom: 40px;
    padding-bottom: 30px;
    border-bottom: 1px solid #e9ecef;
    
    &:last-of-type {
      border-bottom: none;
      margin-bottom: 30px;
    }
  }

  .section-title {
    display: flex;
    align-items: center;
    margin-bottom: 25px;
    color: #2c3e50;
    font-weight: 600;
    font-size: 1.3rem;
    
    .section-icon {
      margin-right: 12px;
      font-size: 1.5rem;
    }
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
      font-size: 1rem;
      transition: all 0.3s ease;
      
      &:focus {
        border-color: #a6c76c;
        box-shadow: 0 0 0 0.2rem rgba(166, 199, 108, 0.25);
      }
      
      &::placeholder {
        color: #adb5bd;
      }
    }
    
    select.form-control {
      appearance: none;
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
      background-position: right 0.5rem center;
      background-repeat: no-repeat;
      background-size: 1.5em 1.5em;
      padding-right: 2.5rem;
    }
  }

  .radio-label {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .radio-icon {
    font-size: 1.2rem !important;
  }

  .MuiFormControl-root {
    width: 100%;
    
    .MuiFormLabel-root {
      font-weight: 600;
      color: #495057;
      margin-bottom: 12px;
      transform: none;
      position: static;
      
      &.Mui-focused {
        color: #495057;
      }
    }
    
    .MuiRadio-root {
      color: #a6c76c;
      
      &.Mui-checked {
        color: #a6c76c;
      }
    }
    
    .MuiFormControlLabel-label {
      font-weight: 500;
    }
  }

  .form-actions {
    display: flex;
    gap: 15px;
    justify-content: flex-end;
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid #e9ecef;
    
    @media (max-width: 576px) {
      flex-direction: column;
    }
    
    .btn {
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
      border: none;
      min-width: 160px;
      justify-content: center;
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      
      &.btn-back {
        background: #6c757d;
        color: white;
        
        &:hover:not(:disabled) {
          background: #5a6268;
          transform: translateY(-1px);
        }
      }
      
      &.btn-primary {
        background: linear-gradient(135deg, #a6c76c 0%, #7aa33a 100%);
        color: white;
        
        &:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(166, 199, 108, 0.4);
        }
      }
    }
  }

  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  
  input[type=number] {
    -moz-appearance: textfield;
  }

  .breadcrumb {
    .breadcrumb-item {
      a {
        cursor: pointer;
        color: #a6c76c;
        
        &:hover {
          color: #7aa33a;
          text-decoration: underline;
        }
      }
      
      &.active {
        color: #6c757d;
      }
    }
  }

  @media (max-width: 768px) {
    .card-body {
      padding: 20px;
    }
    
    .form-section {
      margin-bottom: 30px;
      padding-bottom: 20px;
    }
    
    .section-title {
      font-size: 1.1rem;
    }
    
    .MuiFormControlLabel-root {
      margin-right: 16px;
    }
  }
`;

export default EditAddress