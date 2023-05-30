//import ImagePairs from "./ImagePairs";
function Modal() {
	return (
		//imagepair will be component and possibly image pair title? 
		//share icons in modal footer
		//modal images will be smaller on large screens
		<div className="modal fade" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
			<div className="modal-dialog modal-dialog-centered">
				<div className="modal-content">
					<div className="modal-header">
						<h1 className="modal-title fs-5" id="exampleModalLabel">Modal title</h1>
						<button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div className="modal-body">
						
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