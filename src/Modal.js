import SocialShare from "./SocialFollow"
function Modal(props) {
	const selectedImages = props.selectedImages;
	return (
		// possibly image pair title? yes
		//share icons in modal footer
		//modal images break on smaller screens
		<div className="modal fade" id="imagePreview" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
			<div className="modal-dialog modal-dialog-centered">
				<div className="modal-content">
					<div className="modal-header">
						
						<button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
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
					{/* find functionality for download buttons */}
						<button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Download Pair</button>
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