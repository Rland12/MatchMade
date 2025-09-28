function Modal(props) {
	const { selectedImages } = props;
	//future:image alt title will be file name?
	const set = selectedImages?.imageSet ?? [];      // array or []
	const title = selectedImages?.title ?? '';       // string or ''
	const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
	const handleDownload = () => {
    if (!set.length) return; // nothing to download

    if (isMobile && navigator.share && !navigator.userAgent.includes('Instagram')) {
      const files = set.map((image, idx) => ({
        url: image.url,
        name: `image_${idx + 1}.${(image.url?.split('.').pop() || 'png')}`
      }));
      navigator.share({ files }).catch(err => console.error('Share error:', err));
    } else if (isMobile && navigator.userAgent.includes('iPhone')) {
      alert("To save the images, please long-press on each image and choose 'Save Image'.");
    } else {
      set.forEach((image, idx) => {
        const link = document.createElement('a');
        const ext = image.url?.split('.').pop() || 'png';
        link.href = image.url;
        link.download = `image_${idx + 1}.${ext}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.click();
      });
    }
  };


	return (
		//future:share icons in modal footer
		//future:in modal add credit to artist if original work
		  <div className="modal fade" id="imagePreview" tabIndex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>

          <div className="modal-body">
            <div className="container">
              <div className="row">
                {set.map((img, index) => (
                  <div className="col-6 d-flex justify-content-center" key={(img.url || '') + index}>
                    <img src={img.url} className="img-fluid m-1" alt={img.alt || ''} />
                  </div>
                ))}
                <h2 className="modal-title fs-3" id="modalTitle">{title}</h2>
              </div>
            </div>
            <button type="button" className="btn" onClick={handleDownload} data-bs-dismiss="modal" disabled={!set.length}>
              Download Image Pair
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Modal;