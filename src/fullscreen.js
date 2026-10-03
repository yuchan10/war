// Fullscreen needs a user gesture; denial must never prevent starting the game.
export function enterFullscreen(doc=document){
 if(doc.fullscreenElement)return;
 const root=doc.querySelector('main');
 if(!root?.requestFullscreen)return;
 try{return Promise.resolve(root.requestFullscreen({navigationUI:'hide'})).catch(()=>{});}catch{return;}
}
