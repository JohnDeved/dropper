# todo
* service worker stop download after abort
* delete file url
* file upload history UI
* recaptcha protected download page for exacutables
* peer to peer service worker encrypted chunk fragment cdn
(indexeddb)
  * server send byte range (fragment) to sw & fragment hash to client
  * sw client check if downloaded fragment matches fragment hash
  * store fragment hash in indexeddb
  * store fragment bytes is indexeddb
  * next peer, server respond with list of fragment hashes
  * client service worker respond to peers requesting fragment using hash
* "," in filename causes bug?