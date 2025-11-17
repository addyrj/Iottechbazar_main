/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/alt-text */
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAddImageModalState, getAllProducts, productLanState } from "../../../../Database/Action/AdminAction";
import { userListDatatables } from "../../Javascript/Datatbales.Main";
import styled from "styled-components";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { postHeaderWithToken } from "../../../../Database/Utils";
import Lottie from "lottie-react";
import noData from "../../../Components/no_data.json";
import AddImageModal from "../../Components/AddImageModal";

const AdminProduct = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const allProducts = useSelector((state) => state.AdminReducer.allProducts);
  const addImageModalState = useSelector((state) => state.AdminReducer.addImageModalState)
  const [productData, setProductData] = useState([])

  const handleDeleteProduct = (slug) => {
    // Add confirmation dialog
    if (window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      const formData = new FormData();
      formData.append("slug", slug);

      axios.post(
        `${process.env.REACT_APP_BASE_URL}deleteProduct`,
        formData,
        postHeaderWithToken
      )
        .then((response) => {
          if (response.data.status === 200) {
            toast.success(response.data.message);
            // Refresh the product list
            dispatch(getAllProducts({ navigate: navigate }));
          }
        })
        .catch((error) => {
          console.log("Error:", error);
          toast.error(error.response?.data?.message || error.message);
        });
    }
  };

  useEffect(() => {
    dispatch(getAllProducts({ navigate: navigate }));
  }, [dispatch, location.pathname]);

  useEffect(() => {
    if (productData.length !== 0) {
      userListDatatables();
    }
  }, [productData]);

  useEffect(() => {
    setProductData(allProducts)
  }, [allProducts])

  return (
    <Wrapper>
      <>
        {addImageModalState === true ? <AddImageModal /> : ""}
        <section className="content">
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">
                    <i className="fas fa-boxes mr-2"></i>
                    Product Management
                  </h3>
                  <div className="card-tools">
                    <span className="product-count">
                      {allProducts?.length || 0} Products
                    </span>
                  </div>
                </div>
                <div className="card-body mb-4">
                  <div className="page-event">
                    <NavLink to={"/admin_add_product"} className="buttonStyle primary">
                      <i className="fas fa-plus-circle mr-2"></i>
                      Add Product
                    </NavLink>
                    <button className="buttonStyle secondary">
                      <i className="fas fa-percentage mr-2"></i>
                      GST Rate
                    </button>
                  </div>
                  <table
                    id="datatable"
                    className="table table-bordered table-hover table-fixed"
                    style={{ width: "100%" }}
                  >
                    {allProducts?.length === 0 ? (
                      <div className="noDataStyle">
                        <Lottie
                          className="lottieStyle"
                          style={{ width: "300px", height: "300px" }}
                          animationData={noData}
                          loop={true}
                        />
                        <p className="no-data-text">No products found. Start by adding your first product!</p>
                      </div>
                    ) : (
                      <>
                        <thead>
                          <tr>
                            <th className="col-1 text-center">ID</th>
                            <th className="col-2 text-left">Product</th>
                            <th className="col-2">Category</th>
                            <th className="col-1 text-center">Price</th>
                            <th className="col-1 text-center">Stock</th>
                            <th className="col-1 text-center">Image</th>
                            <th className="col-1 text-center">Created By</th>
                            <th className="col-2 text-center">Status</th>
                            <th className="col-1 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allProducts?.map((currElem, index) => {
                            return (
                              <tr key={index} className="product-row">
                                <td className="table-text-style text-center">
                                  <span className="product-id">{currElem.id}</span>
                                </td>
                                <td className="table-text-style">
                                  <div className="product-info">
                                    <div className="nameTextStyle" title={currElem.name}>
                                      {currElem.name}
                                    </div>
                                    {currElem.subScript && (
                                      <div className="sub-script">
                                        {currElem.subScript}
                                      </div>
                                    )}
                                    <div className="product-sku">
                                      SKU: {currElem.poductSku}
                                    </div>
                                  </div>
                                </td>
                                <td className="table-text-style">
                                  <div className="category-info">
                                    <div className="category-name">
                                      {currElem.categoryName}
                                    </div>
                                    {currElem.subCategoryName && (
                                      <div className="sub-category">
                                        {currElem.subCategoryName}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="table-text-style text-center">
                                  <div className="price-info">
                                    <div className="current-price">₹{currElem.productSpecialPrice}</div>
                                    {currElem.discount > 0 && (
                                      <div className="original-price">
                                        <s>₹{currElem.productPrice}</s>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="table-text-style text-center">
                                  <div className={`stock-badge ${currElem.stock > 10 ? 'in-stock' : currElem.stock > 0 ? 'low-stock' : 'out-of-stock'}`}>
                                    {currElem.stock}
                                  </div>
                                </td>
                                <td className="table-text-style text-center">
                                  <div className="image-container">
                                    {currElem.primaryImage ? (
                                      <img
                                        className="imageStyle"
                                        src={process.env.REACT_APP_IMAGE_URL + currElem.primaryImage}
                                        alt={currElem.name}
                                      />
                                    ) : (
                                      <div className="no-image-placeholder">
                                        <i className="fas fa-image"></i>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="table-text-style text-center">
                                  <span className="created-by-badge">
                                    {currElem.createdBy}
                                  </span>
                                </td>
                                <td className="table-text-style text-center">
                                  <div className={`status-badge ${currElem.status === "true" ? "active" : "inactive"}`}>
                                    {currElem.status === "true" ? "Active" : "Inactive"}
                                  </div>
                                </td>
                                <td className="table-text-style text-center">
                                  <div className="action-menu">
                                    <div className="dropdown">
                                      <button
                                        className="action-btn"
                                        data-toggle="dropdown"
                                        aria-haspopup="true"
                                        aria-expanded="false"
                                      >
                                        <i className="fas fa-ellipsis-v"></i>
                                      </button>
                                      <div className="dropdown-menu dropdown-menu-right">
                                        <button
                                          className="dropdown-item"
                                          onClick={() => dispatch(getAddImageModalState({
                                            state: true,
                                            slug: currElem.slug,
                                            name: currElem.name
                                          }))}
                                        >
                                          <i className="fas fa-images text-primary mr-2"></i>
                                          Add Banner Images
                                        </button>

                                        <NavLink
                                          to={"/admin_edit_product"}
                                          className="dropdown-item"
                                          state={{
                                            id: currElem.id,
                                            slug: currElem.slug,
                                            name: currElem.name,
                                            hsnCode: currElem.hsnCode,
                                            productSku: currElem.productSku, // Fixed: was poductSku
                                            model: currElem.model,
                                            productPrice: currElem.productPrice,
                                            productSpecialPrice: currElem.productSpecialPrice,
                                            discountType: currElem.discountType,
                                            description: currElem.description,
                                            offer: currElem.offer,
                                            discount: currElem.discount,
                                            basePrice: currElem.basePrice,
                                            stock: currElem.stock,
                                            primaryImage: currElem.primaryImage,
                                            status: currElem.status,
                                            categorySlug: currElem.categorySlug,
                                            categoryName: currElem.categoryName,
                                            subCategorySlug: currElem.subCategorySlug,
                                            subCategoryName: currElem.subCategoryName,
                                            createdBy: currElem.createdBy,
                                            subScript: currElem.subScript,
                                            secondaryImage: currElem.secondaryImage,
                                            specification: currElem.specification,
                                            manufacturer: currElem.manufacturer,
                                            warrantyState: currElem.warrantyState,
                                            warranty: currElem.warranty,
                                            trending: currElem.trending,
                                            onsale: currElem.onsale,
                                            commingsoon: currElem.commingsoon,
                                            schoolproject: currElem.schoolproject,
                                            special: currElem.special,
                                            rating: currElem.rating,
                                            review: currElem.review,
                                            productSectionValue: currElem.productSectionValue || [],
                                            gstRate: currElem.gstRate,
                                            gst: currElem.gst,
                                            metaTag: currElem.metaTag,
                                            flipkartLink: currElem.flipkartLink, // Fixed: was flipLink
                                            amazonLink: currElem.amazonLink,
                                            meeshoLink: currElem.meeshoLink,
                                            colorVariantSlug: currElem.colorVariantSlug, // Fixed: was colorVarinat
                                            attributeSlug: currElem.attributeSlug, // Fixed: was attribute
                                            attributeFamilySlug: currElem.attributeFamilySlug // Fixed: was attributeFamily
                                          }}
                                        >
                                          <i className="fas fa-edit text-warning mr-2"></i>
                                          Edit Product
                                        </NavLink>

                                        <button
                                          className="dropdown-item"
                                          onClick={() => dispatch(productLanState({
                                            proLanState: true,
                                            proSlug: currElem.slug
                                          }))}
                                        >
                                          <i className="fas fa-language text-info mr-2"></i>
                                          Add Languages
                                        </button>

                                        <div className="dropdown-divider"></div>

                                        <button
                                          className="dropdown-item text-danger"
                                          onClick={() => handleDeleteProduct(currElem.slug)}
                                        >
                                          <i className="fas fa-trash mr-2"></i>
                                          Delete Product
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </>
                    )}
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>
      </>
    </Wrapper>
  );
};

const Wrapper = styled.section`
  .card-header {
    background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
    color: white;
    border-bottom: none;
    padding: 1rem 1.5rem;
    
    .card-title {
      font-weight: 600;
      margin: 0;
      font-size: 1.25rem;
      
      i {
        opacity: 0.9;
      }
    }
    
    .product-count {
      background: rgba(255, 255, 255, 0.2);
      padding: 0.25rem 0.75rem;
      border-radius: 15px;
      font-size: 0.875rem;
      font-weight: 500;
    }
  }

  .product-row {
    transition: all 0.2s ease;
    
    &:hover {
      background-color: #f8f9fa;
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  }

  .table-text-style {
    color: #2d3748;
    font-size: 14px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    vertical-align: middle;
    transition: color 0.2s ease;
  }

  .page-event {
    position: absolute;
    width: 75%;
    height: 2.5rem;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: start;
    z-index: 999;
    gap: 15px;
    margin-top: -7px;
    margin-left: 400px;

    .buttonStyle {
      width: auto;
      min-width: 160px;
      height: 2.5rem;
      color: white;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.3s ease;
      text-decoration: none;
      padding: 0 20px;
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      
      &.primary {
        background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
        
        &:hover {
          background: linear-gradient(135deg, #138496 0%, #117a8b 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(23, 162, 184, 0.3);
        }
      }
      
      &.secondary {
        background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
        
        &:hover {
          background: linear-gradient(135deg, #5a6268 0%, #495057 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(108, 117, 125, 0.3);
        }
      }
    }
  }

  .product-info {
    .nameTextStyle {
      white-space: nowrap;
      width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 2px;
      font-size: 14px;
    }
    
    .sub-script {
      font-size: 12px;
      color: #6c757d;
      margin-bottom: 2px;
    }
    
    .product-sku {
      font-size: 11px;
      color: #8a8a8a;
    }
  }

  .category-info {
    .category-name {
      font-weight: 500;
      margin-bottom: 2px;
      font-size: 14px;
    }
    
    .sub-category {
      font-size: 12px;
      color: #6c757d;
    }
  }

  .price-info {
    .current-price {
      font-weight: 600;
      color: #2d3748;
      font-size: 14px;
    }
    
    .original-price {
      font-size: 12px;
      color: #6c757d;
    }
  }

  .stock-badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    min-width: 40px;
    
    &.in-stock {
      background-color: #d4edda;
      color: #155724;
    }
    
    &.low-stock {
      background-color: #fff3cd;
      color: #856404;
    }
    
    &.out-of-stock {
      background-color: #f8d7da;
      color: #721c24;
    }
  }

  .image-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .imageStyle {
      width: 70px;
      height: 60px;
      object-fit: cover;
      border-radius: 6px;
    
    }
    
    .no-image-placeholder {
      width: 70px;
      height: 60px;
      background: #f8f9fa;
    
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6c757d;
      
      i {
        font-size: 14px;
      }
    }
  }

  .created-by-badge {
    background: #e3f2fd;
    color: #1976d2;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }

  .status-badge {
    display: inline-block;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    
    &.active {
      background-color: #28a745;
      color: #155724;
    }
    
    &.inactive {
      background-color: #f8d7da;
      color: #721c24;
    }
  }

  .action-menu {
    .action-btn {
      background: none;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      padding: 6px 12px;
      color: #6c757d;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 14px;
      
      &:hover {
        background-color: #f8f9fa;
        border-color: #17a2b8;
        color: #17a2b8;
      }
    }
    
    .dropdown-menu {
      border: none;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      padding: 0.5rem;
      
      .dropdown-item {
        padding: 8px 12px;
        font-size: 13px;
        display: flex;
        align-items: center;
        border-radius: 4px;
        margin-bottom: 2px;
        cursor: pointer;
        border: none;
        background: none;
        width: 100%;
        text-align: left;
        
        &:hover {
          background-color: #f8f9fa;
        }
        
        &.text-danger:hover {
          background-color: #f8d7da;
          color: #721c24;
        }
      }
    }
  }

  .noDataStyle {
    width: 100%;
    height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    margin-top: 60px;
    
    .no-data-text {
      margin-top: 1rem;
      color: #6c757d;
      font-size: 14px;
    }
  }

  .product-id {
    font-family: 'Courier New', monospace;
    font-weight: 600;
    color: #495057;
    background: #f8f9fa;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 13px;
  }

  @media (max-width: 768px) {
    .page-event {
      position: relative;
      width: 100%;
      margin-top: 0;
      margin-bottom: 20px;
      margin-left: 0;
      justify-content: center;
    }
    
    .nameTextStyle {
      width: 150px !important;
    }
  }
`;

export default AdminProduct;