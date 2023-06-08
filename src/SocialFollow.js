import {
    FacebookMessengerShareButton,
    FacebookMessengerIcon,
    TelegramShareButton,
    TelegramIcon,
    TwitterShareButton,
    TwitterIcon,
    WhatsappShareButton,
    WhatsappIcon
  } from "react-share";
  import ImagePairs from "./ImagePairs";
  //add sharing functionality. url has to be image pair url
 function SocialShare() {
  return (
    <div class="social-container">
      <h3>Share:</h3>
      <div>
      <FacebookMessengerShareButton
        url={<ImagePairs imageObject/>}
        appId={'add app id'}
        quote={'Dummy text!'}
        hashtag="#muo"
      >
        <FacebookMessengerIcon size={40} round />
      </FacebookMessengerShareButton>

      <TwitterShareButton
  url={'https://www.example.com'}
  quote={'Dummy text!'}
  hashtag="#muo"
>
  <TwitterIcon size={40} round />
</TwitterShareButton>

<TelegramShareButton
  url={'https://www.example.com'}
  quote={'Dummy text!'}
  hashtag="#muo"
>
  <TelegramIcon size={40} round />
</TelegramShareButton>

<WhatsappShareButton
  url={'https://www.example.com'}
  quote={'Dummy text!'}
  hashtag="#muo"
>
  <WhatsappIcon size={40} round />
</WhatsappShareButton>
    </div>
    </div>
  );
}
export default SocialShare;