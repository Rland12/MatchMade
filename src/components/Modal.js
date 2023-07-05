function Modal(props) {
	const { selectedImages } = props;
	//future:image alt title will be file name?
	const handleDownload = () => {
		const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
		
		if (isMobile && navigator.share && !navigator.userAgent.includes("Instagram")) {
		  // Mobile device with share API support
		  const files = selectedImages.imageSet.map((image, index) => ({
			url: image.url,
			name: `image_${index + 1}.${image.url.split(".").pop()}`,
		  }));
	  
		  navigator.share({
			files,
		  })
			.then(() => {
			  console.log("Images shared successfully.");
			})
			.catch((error) => {
			  console.error("Error sharing images:", error);
			});
		} else if (isMobile && navigator.userAgent.includes("iPhone")) {
		  // iPhone with no share API support
		  alert("To save the images, please long-press on each image and choose 'Save Image'.");
		} else {
		  // Desktop or other mobile devices
		  selectedImages.imageSet.forEach((image, index) => {
			const link = document.createElement("a");
			const extension = image.url.split(".").pop();
			const filename = `image_${index + 1}.${extension}`;
			link.href = image.url;
			link.download = filename;
			link.target = "_blank";
			link.rel = "noopener noreferrer";
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
						<button type="button" className="btn" onClick={handleDownload} data-bs-dismiss="modal" >
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