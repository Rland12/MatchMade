// import SocialShare from "./SocialShare";

function Modal(props) {
	const {selectedImages} = props;
	//future:image alt title will be file name?
	const handleDownload = () => {
		selectedImages.imageSet.forEach((image, index) => {
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
		//share icons in modal footer
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
								{selectedImages.imageSet && selectedImages.imageSet.map((images, index) => {
									const key = images.url + index;
									return (
										<div className="col-6 d-flex justify-content-center" key={key}>
											<img src={images.url} className="img-fluid m-1" alt={images.alt} />
										</div>
									);

								})}
								<h1 className="modal-title fs-3" id="modalTitle">{selectedImages.title}</h1>
							</div>
						</div>
						<button type="button" className="btn"onClick={handleDownload} data-bs-dismiss="modal" >
							Download Image Pair
						</button>
					</div>
					{/* <div className="modal-footer justify-content-center">
						<SocialShare />
					</div> */}
				</div>
			</div>
		</div>
	);
}

export default Modal;