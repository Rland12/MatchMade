import { imageMap } from "../utils/imageMap";
import { useParams } from "react-router-dom";
import NotFound from "./NotFound";

function ImagePairs(props) {
  const params = useParams();
  const { handleClick } = props;
  //Use "/" as the default category if params.category is undefined
  const category = params.category || "/";
  const images = imageMap[category];

  // Check if images exist, if not render the NotFound component
  
  if (!images) {
    return <NotFound />;
  }

  //image-pair class is the group of two images
  //future:on mobile 8 pictures per section
  return (
    <div className="container">
      <div className="row">
        {images.map((col, colIndex) => {
          return (
            <div className="col-md-4" key={`col-${colIndex}`}>
              {col.map((imagePair, pairIndex) => {
                return (
                  <ImagePair images={imagePair} handleClick={handleClick}key={`imagePair-${colIndex}-${pairIndex}`}/>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
const ImagePair = props => {
  const { images, handleClick } = props;
  return (
    <div className="row" onClick={() => handleClick(images)}>
      {images.imageSet.map((imageObject, index) => {
        const key = imageObject.url + index;
        return (
          <div className="col-6 d-flex justify-content-center" key={key}>
            <img src={imageObject.url} alt={imageObject.alt} className="img-fluid m-1" data-bs-toggle="modal" data-bs-target="#imagePreview" />
          </div>
        );
      })}
    </div>
  );
}

export default ImagePairs;
