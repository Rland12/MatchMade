import SocialShare from "./SocialShare";
function Modal(props) {
	const selectedImages = props.selectedImages;
	// Function to handle the download button click
	//future:image pair title will be file name
	const handleDownload = () => {
		selectedImages.forEach((image, index) => {
		  const link = document.createElement("a");
		  const extension = image.url.split(".").pop(); // Extract the extension from the image URL
		  const filename = `image_${index + 1}.${extension}`;
		  link.href = image.url;
		  link.download = filename;
		  link.target = "_blank";
		  link.rel = "noopener noreferrer";
		  link.click();
		});
	  };
	return (
		// possibly image pair title? yes
		//share icons in modal footer
		//modal images break on smaller screens
		<div className="modal fade" id="imagePreview" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
			<div className="modal-dialog modal-dialog-centered">
				<div className="modal-content">
					<div className="modal-header">
						<button type="button" className="btn-close" data-bs-dismiss="modal" data-bs-theme="dark" aria-label="Close"></button>
					</div>
					<div className="modal-body">
					<div className="container">
						<div className="row">
							{selectedImages.map(images => {
								return (
									<div className="col-md-6 d-flex justify-content-center">
										<img src={images.url} className="img-fluid m-1" />
									</div>
								)
							})}
							{/* find out how to map title to the different pairs */}
							<h1 className="modal-title fs-3" id="exampleModalLabel">Modal title</h1>
						</div>
					</div>
					<button type="button" className="btn btn-secondary" onClick={handleDownload}>
              Download Image Pair
            </button>
					</div>
					<div className="modal-footer justify-content-center">
						<SocialShare/>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Modal;