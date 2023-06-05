//import ImagePairs from "./ImagePairs";
function Modal(props) {
	const selectedImages = props.selectedImages;
	return (
		// possibly image pair title? yes
		//share icons in modal footer
		//modal images break on smaller screens
		<div className="modal fade" id="leaf" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
			<div className="modal-dialog modal-dialog-centered">
				<div className="modal-content">
					<div className="modal-header">
						<h1 className="modal-title fs-5" id="exampleModalLabel">Modal title</h1>
						<button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div className="modal-body row">
						<div className="row">
							{selectedImages.map(images => {
								return (
									<div className="col-md-6 d-flex justify-content-center">
										<img src={images.url} className="img-fluid m-1" />
									</div>
								)
							})}
						</div>
						<button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Download Pair</button>
					</div>
					<div className="modal-footer">
						<button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
					</div>
				</div>
			</div>
		</div>
	);
}

export default Modal;