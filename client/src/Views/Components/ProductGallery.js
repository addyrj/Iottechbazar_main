// /* eslint-disable jsx-a11y/anchor-is-valid */
// /* eslint-disable jsx-a11y/img-redundant-alt */
// import React, { useState } from 'react'
// import ImageMagnifier from './ImageMagnifier'
// import { useDispatch } from 'react-redux'
// import { openImageModal } from '../../Database/Action/DashboardAction'

// const ProductGallery = ({ primaryImage, secondaryImage }) => {
//     // console.log(secondaryImage)
//     const dispatch = useDispatch();
//     const [activeImage, setActiveImage] = useState(process.env.REACT_APP_IMAGE_URL + primaryImage)
//     return (
//         <div className="product-gallery product-gallery-vertical">
//             <div className="row">
//                 <figure className="product-main-image">
//                     <ImageMagnifier
//                         src={activeImage}
//                         width="100%"
//                         height="100%"
//                     />
//                     <a
//                         onClick={() => dispatch(openImageModal(true))}
//                         id="btn-product-gallery"
//                         className="btn-product-gallery"
//                     >
//                         <i className="icon-arrows" />
//                     </a>
//                 </figure>
//                 {/* End .product-main-image */}
//                 <div id="product-zoom-gallery" className="product-image-gallery">
//                     {
//                         secondaryImage?.map((item) => {
//                             return (
//                                 <a
//                                     className="product-gallery-item active"
//                                     onClick={() => setActiveImage(process.env.REACT_APP_IMAGE_URL + item)}
//                                 >
//                                     <img
//                                         src={process.env.REACT_APP_IMAGE_URL + item}
//                                         alt="product side"
//                                     />
//                                 </a>
//                             )
//                         })
//                     }
//                 </div>
//                 {/* End .product-image-gallery */}
//             </div>
//             {/* End .row */}
//         </div>
//     )
// }
/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/img-redundant-alt */
import React, { useState, useEffect } from 'react'
import ImageMagnifier from './ImageMagnifier'
import { useDispatch } from 'react-redux'
import { openImageModal } from '../../Database/Action/DashboardAction'
import axios from 'axios'
import { getHeaderWithToken } from '../../Database/ApiHeader'

const ProductGallery = ({ primaryImage, slug }) => {
    const dispatch = useDispatch();
    const [activeIndex, setActiveIndex] = useState(0);
    const [allMedia, setAllMedia] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch gallery data from API
    useEffect(() => {
        const fetchGalleryData = async () => {
            if (!slug) {
                console.log('No slug provided, showing only primary image');
                // Only primary image
                if (primaryImage) {
                    setAllMedia([{
                        type: 'image',
                        url: `${process.env.REACT_APP_IMAGE_URL}${primaryImage}`,
                        id: 'primary-image',
                        isPrimary: true
                    }]);
                }
                return;
            }
            
            try {
                setLoading(true);
                const response = await axios.get(
                    process.env.REACT_APP_BASE_URL + `getMultipleImageVideo/${slug}`,
                    getHeaderWithToken
                );
                
                if (response.data.status === 200) {
                    const galleryImages = response.data.data.galleryImage || [];
                    const galleryVideos = response.data.data.galleryVideo || [];
                    
                    // Combine all media: primary image + gallery images + gallery videos
                    const mediaArray = [];
                    
                    // Add primary image first (always)
                    if (primaryImage) {
                        mediaArray.push({
                            type: 'image',
                            url: `${process.env.REACT_APP_IMAGE_URL}${primaryImage}`,
                            id: 'primary-image',
                            isPrimary: true
                        });
                    }
                    
                    // Add gallery images
                    galleryImages.forEach((img, index) => {
                        const imageUrl = getImageUrl(img.path);
                        mediaArray.push({
                            type: 'image',
                            url: imageUrl,
                            id: `gallery-image-${index}`,
                            filename: img.filename
                        });
                    });
                    
                    // Add gallery videos
                    galleryVideos.forEach((vid, index) => {
                        const videoUrl = getImageUrl(vid.path);
                        mediaArray.push({
                            type: 'video',
                            url: videoUrl,
                            id: `gallery-video-${index}`,
                            filename: vid.filename
                        });
                    });
                    
                    setAllMedia(mediaArray);
                }
            } catch (error) {
                console.error("Error fetching gallery data:", error);
                // Fallback: only show primary image
                if (primaryImage) {
                    setAllMedia([{
                        type: 'image',
                        url: `${process.env.REACT_APP_IMAGE_URL}${primaryImage}`,
                        id: 'primary-image',
                        isPrimary: true
                    }]);
                }
            } finally {
                setLoading(false);
            }
        }

        fetchGalleryData();
    }, [slug, primaryImage]);

    // Function to get full URL for gallery files
    const getImageUrl = (path) => {
        if (!path) return '';
        
        if (path.includes('http')) {
            return path;
        }
        
        // Normalize path and extract filename
        let normalizedPath = path.replace(/\\/g, '/');
        const filename = normalizedPath.replace(/^files\//, '');
        
        // Construct URL using /images endpoint
        return `${process.env.REACT_APP_BASE_URL}images/${filename}`;
    }

    const handleThumbnailClick = (index) => {
        setActiveIndex(index);
    };

    const handleMainImageClick = () => {
        if (allMedia[activeIndex]?.type === 'image') {
            dispatch(openImageModal(true));
        }
    };

    if (loading) {
        return (
            <div className="product-gallery product-gallery-vertical">
                <div className="row">
                    <div className="loading-placeholder" style={{ 
                        padding: '2rem', 
                        textAlign: 'center',
                        color: '#666'
                    }}>
                        Loading gallery...
                    </div>
                </div>
            </div>
        );
    }

    if (!allMedia.length) {
        return (
            <div className="product-gallery product-gallery-vertical">
                <div className="row">
                    <div style={{
                        width: '100%',
                        height: '400px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        background: '#f7f7f7',
                        borderRadius: '12px',
                        color: '#999',
                        fontSize: '16px'
                    }}>
                        No Media Available
                    </div>
                </div>
            </div>
        );
    }

    const currentMedia = allMedia[activeIndex];

    return (
        <div className="product-gallery" style={{ display: 'flex', gap: '15px' }}>
            {/* Thumbnails - Vertical on left */}
            <div
                className="thumbnails"
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    maxHeight: '500px',
                    overflowY: 'auto',
                    padding: '5px'
                }}
            >
                {allMedia.map((media, index) => (
                    <div
                        key={media.id}
                        onClick={() => handleThumbnailClick(index)}
                        style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: index === activeIndex ? '2px solid #a6c76c' : '2px solid #e0e0e0',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            position: 'relative',
                            backgroundColor: '#fafafa',
                        }}
                    >
                        {media.type === 'image' ? (
                            <img
                                src={media.url}
                                alt={`Thumbnail ${index + 1}`}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                }}
                                onError={(e) => {
                                    console.error('Error loading thumbnail:', media.url);
                                    e.target.style.backgroundColor = '#f0f0f0';
                                    e.target.style.display = 'flex';
                                    e.target.style.alignItems = 'center';
                                    e.target.style.justifyContent = 'center';
                                    e.target.innerHTML = '<div style="color: #666; font-size: 12px;">Image</div>';
                                }}
                            />
                        ) : (
                            <div
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    backgroundColor: '#222',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative'
                                }}
                            >
                                <div style={{
                                    background: 'rgba(0,0,0,0.7)',
                                    borderRadius: '50%',
                                    width: '30px',
                                    height: '30px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <span style={{ fontSize: '12px', marginLeft: '2px' }}>▶</span>
                                </div>
                            </div>
                        )}
                        
                        {/* Primary image badge */}
                        {media.isPrimary && (
                            <div style={{
                                position: 'absolute',
                                top: '5px',
                                left: '5px',
                                background: '#a6c76c',
                                color: 'white',
                                borderRadius: '4px',
                                padding: '2px 4px',
                                fontSize: '10px',
                                fontWeight: 'bold'
                            }}>
                                Main
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Main Media Display */}
            <div
                className="main-media"
                style={{
                    flex: 1,
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '500px'
                }}
            >
                {currentMedia?.type === 'image' ? (
                    <ImageMagnifier
                        src={currentMedia.url}
                        width="100%"
                        height="100%"
                        onClick={handleMainImageClick}
                        style={{ cursor: 'zoom-in' }}
                    />
                ) : (
                    <video 
                        controls 
                        style={{ 
                            width: '100%', 
                            height: '500px', 
                            objectFit: 'contain',
                            backgroundColor: '#000'
                        }}
                        onError={(e) => {
                            console.error('Error loading video:', currentMedia.url);
                        }}
                    >
                        <source src={currentMedia.url} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                )}
                
                {/* Zoom Icon for Images */}
                {currentMedia.type === 'image' && (
                    <div
                        onClick={handleMainImageClick}
                        style={{
                            position: 'absolute',
                            top: '15px',
                            right: '15px',
                            backgroundColor: 'rgba(255,255,255,0.9)',
                            padding: '10px',
                            borderRadius: '50%',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <i className="icon-arrows" style={{ fontSize: '18px', color: '#333' }} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductGallery;