// import React, { useState } from 'react'
// import Modal from 'react-modal';
// import styled from 'styled-components';
// import noImage from "../Assets/img/no_image.png"
// import { useDispatch, useSelector } from 'react-redux';
// import { getAddImageModalState, setLoder } from '../../../Database/Action/AdminAction';
// import toast from "react-hot-toast";
// import axios from 'axios';
// import { postHeaderWithToken } from '../../../Database/Utils';

// const AddImageModal = () => {
//     const [modalIsOpen, setIsOpen] = useState(true);
//     const [avatar, setAvatar] = useState([]);
//     const [image, setImage] = useState([]);
//     const dispatch = useDispatch();
//     const addProductImageInfo = useSelector((state) => state.AdminReducer.addProductImageInfo)
//     const customStyles = {
//         content: {
//             top: '60%',
//             left: '60%',
//             right: 'auto',
//             bottom: 'auto',
//             marginRight: '-50%',
//             transform: 'translate(-50%, -50%)'
//         },
//     };
//     function closeModal() {
//         dispatch(getAddImageModalState({ state: false, slug: "", name: "" }))
//     }

//     const handleChanges = (e) => {
//         setAvatar(e.target.files)
//         let imageList = e.target.files;
//         let images = [];
//         for (let index = 0; index < imageList.length; index++) {
//             const element = imageList[index];
//             images.push(element);
//         }
//         setImage(images)
//     }

//     const addBannerImage = () => {
//         if (avatar.length === 0) {
//             toast.error("Failed! Please add atleast one images")
//         } else {
//             dispatch(setLoder(true))
//             let fromData = new FormData();
//             for (let index = 0; index < avatar.length; index++) {
//                 const element = avatar[index];
//                 fromData.append("avatar", element)
//             }
//             fromData.append("slug", addProductImageInfo?.slug)
//             axios.post(process.env.REACT_APP_BASE_URL + "addSecondaryProductImage", fromData, postHeaderWithToken)
//                 .then((res) => {
//                     console.log(res.data)
//                     dispatch(setLoder(false));
//                     toast.success(res?.data?.message);
//                     closeModal();
//                 })
//                 .catch((error) => {
//                     dispatch(setLoder(false))
//                     console.log("error is   ", error)
//                     toast.error(error?.response?.data?.message || error.message)
//                 })
//         }
//     }

//     return (
//         <>
//             <Modal
//                 isOpen={modalIsOpen}
//                 onRequestClose={closeModal}
//                 style={customStyles}
//                 shouldCloseOnOverlayClick={false}
//                 contentLabel="Iottech Bazaar">
//                 <Wrapper>
//                     <div className='modalbody'>
//                         <h2 className='text-center text-cyan font-italic font-weight-bold'>Iottech Bazaar</h2>
//                         <hr />
//                         <p>Add Seconary Images for <strong className='text-red'>{addProductImageInfo?.name}</strong></p>
//                         <div style={{ width: "600px" }}>
//                             <div className="row">
//                                 <div className="col-md-8">
//                                     <div className="form-group">
//                                         <label htmlFor="exampleInputFile">Select Image*</label>
//                                         <div className="input-group">
//                                             <div className="custom-file">
//                                                 <input
//                                                     type="file"
//                                                     multiple="multiple"
//                                                     className="custom-file-input"
//                                                     id="secondaryImage"
//                                                     name='secondaryImage'
//                                                     onChange={handleChanges}
//                                                 />
//                                                 <label
//                                                     className="custom-file-label"
//                                                     htmlFor="exampleInputFile"
//                                                 >
//                                                     Choose file
//                                                 </label>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </div>
//                                 <div className="col-md-4">
//                                     <div className="form-group">
//                                         <div className='ml-4'>
//                                             {image.length === 0 ? <img src={noImage} style={{ width: "150px", height: "80px", objectFit: "contain" }} /> :
//                                                 <div className='multipleImageStyle'>
//                                                     <div className="grid">
//                                                         {
//                                                             image?.map((item) => {
//                                                                 return (
//                                                                     <img src={URL.createObjectURL(item)} style={{ width: "85px", height: "35px", marginLeft: "3px", marginTop: "3px", objectFit: "cover" }} />
//                                                                 )
//                                                             })
//                                                         }
//                                                     </div>
//                                                 </div>
//                                             }
//                                         </div>
//                                     </div>
//                                 </div>
//                             </div>
//                             <div className='row'>
//                                 <div className="col-md-5" />
//                                 <div className="col-md-7">
//                                     <div className="row">
//                                         <button className='buttonStyle' onClick={() => addBannerImage()}>Submit</button>
//                                         <button className='buttonStyle ml-4' onClick={() => closeModal()}>Cancel</button>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </Wrapper>
//             </Modal>
//         </>
//     )
// }

// const Wrapper = styled.section`
// .buttonStyle{
//     width: 150px;
//     height: 2.5rem;
//     background-color: #17a2b8;
//     color: white;
//     border: none;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     cursor: pointer;
//     font-size: 18px;
//     font-weight: bold;
//     transition: all 0.3s ease;
//     -webkit-transition: all 0.3s ease 0s;
//     -moz-transition: all 0.3s ease 0s;
//     -o-transition: all 0.3s ease 0s;
//     &:hover,
//     &:active {
//       background-color: white;
//       border: #17a2b8 1px solid;
//       color: black;
//       cursor: pointer;
//       transform: scale(0.96);
//     }
//   }
//   .multipleImageStyle{
//     width: 180px;
//     height: 80px;
//     border: 1px solid black;
//   }
//   .grid{
//     display: flex;
//     flex-direction: row;
//     flex-wrap: wrap;
//     gap: 0;
//   }
// `;

// export default AddImageModal
import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import styled from 'styled-components';
import noImage from "../Assets/img/no_image.png";
import { useDispatch, useSelector } from 'react-redux';
import { getAddImageModalState, setLoder } from '../../../Database/Action/AdminAction';
import toast from "react-hot-toast";
import axios from 'axios';
import {
     deleteHeaderWithToken,
      getHeaderWithToken, postHeaderWithToken } from '../../../Database/Utils';

// Icons
const DeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const UploadIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const AddImageModal = () => {
    const [modalIsOpen, setIsOpen] = useState(true);
    const [files, setFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [existingGallery, setExistingGallery] = useState({ images: [], videos: [] });
    const dispatch = useDispatch();
    const addProductImageInfo = useSelector((state) => state.AdminReducer.addProductImageInfo);

    const customStyles = {
        content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            maxWidth: '90vw',
            width: '800px',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '0',
            border: 'none',
            borderRadius: '12px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            zIndex: 10000,
        },
        overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 9999,
        }
    };

    useEffect(() => {
        if (addProductImageInfo?.slug) {
            fetchExistingGallery();
        }
    }, [addProductImageInfo?.slug]);

    const fetchExistingGallery = () => {
        dispatch(setLoder(true));
        axios.get(
            process.env.REACT_APP_BASE_URL + `getMultipleImageVideo/${addProductImageInfo?.slug}`,
            getHeaderWithToken
        )
        .then((res) => {
            dispatch(setLoder(false));
            if (res.data.status === 200) {
                setExistingGallery({
                    images: res.data.data.galleryImage || [],
                    videos: res.data.data.galleryVideo || []
                });
            }
        })
        .catch((error) => {
            dispatch(setLoder(false));
            console.error("Error fetching gallery:", error);
        });
    };

    function closeModal() {
        dispatch(getAddImageModalState({ state: false, slug: "", name: "" }));
    }

    const handleChanges = (e) => {
        const selectedFiles = Array.from(e.target.files);
        const totalFiles = files.length + selectedFiles.length + existingGallery.images.length + existingGallery.videos.length;
        
        if (totalFiles > 6) {
            toast.error(`Maximum 6 files allowed. You have ${existingGallery.images.length + existingGallery.videos.length} existing files.`);
            return;
        }

        setFiles(prev => [...prev, ...selectedFiles]);

        const filePreviews = selectedFiles.map(file => ({
            file,
            type: file.type.startsWith("image/") ? "image" : "video",
            src: URL.createObjectURL(file),
            isNew: true,
            id: Date.now() + Math.random()
        }));

        setPreviews(prev => [...prev, ...filePreviews]);
        e.target.value = '';
    };

    const removeFile = (index, isNew = true) => {
        if (isNew) {
            setPreviews(prev => prev.filter((_, i) => i !== index));
            setFiles(prev => prev.filter((_, i) => i !== index));
        }
    };

    const removeExistingFile = async (filename, type) => {
        if (!window.confirm('Are you sure you want to delete this file?')) return;

        dispatch(setLoder(true));
        try {
            const response = await axios.delete(
                process.env.REACT_APP_BASE_URL + "deleteGalleryFile",
                {
                    ...deleteHeaderWithToken,
                    data: { slug: addProductImageInfo?.slug, filename, type }
                }
            );

            dispatch(setLoder(false));
            if (response.data.status === 200) {
                toast.success(response.data.message);
                setExistingGallery(prev => ({
                    ...prev,
                    [type === 'image' ? 'images' : 'videos']: 
                        prev[type === 'image' ? 'images' : 'videos'].filter(item => item.filename !== filename)
                }));
            }
        } catch (error) {
            dispatch(setLoder(false));
            toast.error(error?.response?.data?.message || error.message);
        }
    };

    const addGalleryFiles = () => {
        if (files.length === 0) {
            toast.error("Please add at least one file (image or video).");
            return;
        }

        dispatch(setLoder(true));
        const formData = new FormData();
        files.forEach(file => {
            formData.append("avatar", file);
        });
        formData.append("slug", addProductImageInfo?.slug);

        axios.post(
            process.env.REACT_APP_BASE_URL + "uploadMultipleImageVideo",
            formData,
            postHeaderWithToken
        )
        .then((res) => {
            dispatch(setLoder(false));
            toast.success(res?.data?.message);
            setFiles([]);
            setPreviews([]);
            fetchExistingGallery();
        })
        .catch((error) => {
            dispatch(setLoder(false));
            toast.error(error?.response?.data?.message || error.message);
        });
    };

    const totalFilesCount = existingGallery.images.length + existingGallery.videos.length + previews.length;

    return (
        <Modal
            isOpen={modalIsOpen}
            onRequestClose={closeModal}
            style={customStyles}
            shouldCloseOnOverlayClick={true}
            contentLabel="Iottech Bazaar - Gallery Management"
        >
            <Wrapper>
                <div className='modal-container'>
                    <div className='modal-header'>
                        <div className='header-content'>
                            <h2 className='brand-title'>Iottech Bazaar</h2>
                            <p className='subtitle'>Gallery Management</p>
                        </div>
                        <button className='close-btn' onClick={closeModal}>×</button>
                    </div>
                    
                    <div className='modal-body'>
                        <div className='product-info-section'>
                            <div className='product-badge'>
                                Managing gallery for: <span className='product-name'>{addProductImageInfo?.name}</span>
                            </div>
                        </div>

                        <div className="file-upload-section">
                            <div className="upload-area">
                                <label className={`upload-label ${totalFilesCount >= 6 ? 'disabled' : ''}`}>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*,video/*"
                                        onChange={handleChanges}
                                        disabled={totalFilesCount >= 6}
                                    />
                                    <div className="upload-box">
                                        <div className="upload-icon">
                                            <UploadIcon />
                                        </div>
                                        <div className="upload-text">
                                            <div className="upload-title">Click to upload images/videos</div>
                                            <small className="upload-subtitle">
                                                {totalFilesCount >= 6 
                                                    ? 'Maximum limit reached' 
                                                    : `${6 - totalFilesCount} of 6 slots remaining`
                                                }
                                            </small>
                                        </div>
                                    </div>
                                </label>
                            </div>

                            {/* Existing Gallery */}
                            {(existingGallery.images.length > 0 || existingGallery.videos.length > 0) && (
                                <div className="gallery-section">
                                    <div className="section-header">
                                        <h4>Existing Gallery Files</h4>
                                        <span className="file-count">
                                            {existingGallery.images.length + existingGallery.videos.length} files
                                        </span>
                                    </div>
                                    <div className="gallery-grid">
                                        {existingGallery.images.map((item, index) => (
                                            <div key={item.filename} className="gallery-item">
                                                <div className="media-container">
                                                    <img 
                                                        src={process.env.REACT_APP_BASE_URL + item.path} 
                                                        alt={`Gallery ${index + 1}`}
                                                    />
                                                </div>
                                                <button 
                                                    className="delete-btn"
                                                    onClick={() => removeExistingFile(item.filename, 'image')}
                                                    title="Delete file"
                                                >
                                                    <DeleteIcon />
                                                </button>
                                            </div>
                                        ))}
                                        {existingGallery.videos.map((item, index) => (
                                            <div key={item.filename} className="gallery-item">
                                                <div className="media-container">
                                                    <video controls>
                                                        <source src={process.env.REACT_APP_BASE_URL + item.path} type={item.mimetype} />
                                                    </video>
                                                </div>
                                                <button 
                                                    className="delete-btn"
                                                    onClick={() => removeExistingFile(item.filename, 'video')}
                                                    title="Delete file"
                                                >
                                                    <DeleteIcon />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* New Files Preview */}
                            {previews.length > 0 && (
                                <div className="preview-section">
                                    <div className="section-header">
                                        <h4>New Files to Upload</h4>
                                        <span className="file-count">{previews.length} files</span>
                                    </div>
                                    <div className="preview-grid">
                                        {previews.map((item, index) => (
                                            <div key={item.id} className="preview-item">
                                                <div className="media-container">
                                                    {item.type === "image" ? (
                                                        <img src={item.src} alt={`Preview ${index + 1}`} />
                                                    ) : (
                                                        <video controls>
                                                            <source src={item.src} type={item.file.type} />
                                                        </video>
                                                    )}
                                                </div>
                                                <button 
                                                    className="delete-btn"
                                                    onClick={() => removeFile(index)}
                                                    title="Remove file"
                                                >
                                                    <DeleteIcon />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className='modal-actions'>
                            <button 
                                className='btn btn-primary' 
                                onClick={addGalleryFiles}
                                disabled={files.length === 0}
                            >
                                Upload {files.length} File(s)
                            </button>
                            <button className='btn btn-secondary' onClick={closeModal}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </Wrapper>
        </Modal>
    )
}

const Wrapper = styled.section`
.modal-container {
    background: white;
    border-radius: 12px;
    overflow: hidden;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 2rem 2rem 1rem;
    background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
    color: white;
    position: relative;

    .header-content {
        .brand-title {
            margin: 0;
            font-size: 1.75rem;
            font-weight: 700;
            letter-spacing: -0.5px;
        }

        .subtitle {
            margin: 0.25rem 0 0 0;
            opacity: 0.9;
            font-size: 0.9rem;
        }
    }

    .close-btn {
        background: rgba(255,255,255,0.2);
        border: none;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        font-size: 1.5rem;
        cursor: pointer;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;

        &:hover {
            background: rgba(255,255,255,0.3);
            transform: scale(1.1);
        }
    }
}

.modal-body {
    padding: 0 2rem 2rem;
}

.product-info-section {
    margin: 1.5rem 0 2rem;

    .product-badge {
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 1rem 1.5rem;
        text-align: center;
        font-size: 1rem;
        color: #495057;

        .product-name {
            color: #dc3545;
            font-weight: 600;
            margin-left: 0.5rem;
        }
    }
}

.file-upload-section {
    margin-bottom: 2rem;
}

.upload-area {
    margin-bottom: 2.5rem;

    .upload-label {
        cursor: pointer;
        display: block;
        
        input[type="file"] {
            display: none;
        }

        .upload-box {
            border: 2px dashed #17a2b8;
            border-radius: 12px;
            padding: 3rem 2rem;
            text-align: center;
            transition: all 0.3s ease;
            background: #f8fdff;
            position: relative;
            overflow: hidden;

            &::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(23, 162, 184, 0.1), transparent);
                transition: left 0.5s;
            }

            &:hover::before {
                left: 100%;
            }

            &:hover {
                background: #f0f9ff;
                border-color: #138496;
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(23, 162, 184, 0.15);
            }

            .upload-icon {
                color: #17a2b8;
                margin-bottom: 1rem;
                display: flex;
                justify-content: center;
            }

            .upload-text {
                .upload-title {
                    color: #495057;
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                }
                
                .upload-subtitle {
                    color: #6c757d;
                    font-size: 0.85rem;
                }
            }
        }

        &.disabled {
            cursor: not-allowed;
            
            .upload-box {
                opacity: 0.6;
                border-color: #6c757d;
                background: #f8f9fa;
                
                &:hover {
                    transform: none;
                    box-shadow: none;
                    border-color: #6c757d;
                }
            }
        }
    }
}

.gallery-section, .preview-section {
    margin-bottom: 2rem;

    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid #e9ecef;

        h4 {
            color: #495057;
            margin: 0;
            font-size: 1.1rem;
            font-weight: 600;
        }

        .file-count {
            background: #17a2b8;
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 500;
        }
    }
}

.gallery-grid, .preview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 1rem;
}

.gallery-item, .preview-item {
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    transition: all 0.3s ease;
    background: white;
    border: 1px solid #e9ecef;

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 20px rgba(0,0,0,0.15);
    }

    .media-container {
        width: 100%;
        height: 140px;
        overflow: hidden;

        img, video {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }
    }

    .delete-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        background: rgba(220, 53, 69, 0.95);
        border: none;
        border-radius: 6px;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: white;
        opacity: 0;
        transition: all 0.3s ease;
        backdrop-filter: blur(4px);

        &:hover {
            background: #dc3545;
            transform: scale(1.1);
        }
    }

    &:hover .delete-btn {
        opacity: 1;
    }
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e9ecef;

    .btn {
        padding: 0.875rem 2rem;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.9rem;
        transition: all 0.3s ease;
        min-width: 120px;

        &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none !important;
        }

        &.btn-primary {
            background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
            color: white;

            &:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 6px 15px rgba(23, 162, 184, 0.3);
            }
        }

        &.btn-secondary {
            background: #6c757d;
            color: white;

            &:hover {
                background: #5a6268;
                transform: translateY(-2px);
                box-shadow: 0 6px 15px rgba(108, 117, 125, 0.3);
            }
        }
    }
}

@media (max-width: 768px) {
    .modal-header {
        padding: 1.5rem 1.5rem 1rem;
        
        .brand-title {
            font-size: 1.5rem;
        }
    }

    .modal-body {
        padding: 0 1.5rem 1.5rem;
    }

    .modal-actions {
        flex-direction: column;
        
        .btn {
            width: 100%;
        }
    }

    .gallery-grid, .preview-grid {
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 0.75rem;
    }

    .gallery-item .media-container,
    .preview-item .media-container {
        height: 120px;
    }
}

@media (max-width: 480px) {
    .gallery-grid, .preview-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}
`;

export default AddImageModal;