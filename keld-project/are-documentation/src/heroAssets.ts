const asset=(name:string)=>`${import.meta.env.BASE_URL}assets/cyber-engine/${name}.webp`;
export const responsive=(name:string)=>({src:asset(name),srcSet:`${asset(`${name}-384`)} 384w, ${asset(name)} 768w`,sizes:'(max-width: 500px) 120px, min(50vw, 50vh)'});

export function preloadHeroAssets(){
 // Called only when the intro's lazy component is requested.
 if(document.querySelector('link[data-are-hero]'))return;
 for(const name of ['base','block','intake','assembled','brain']){
  const link=document.createElement('link');
  if(!('imageSrcset' in link))return;
  const image=responsive(name);link.rel='preload';link.as='image';link.href=image.src;
  link.setAttribute('imagesrcset',image.srcSet);link.setAttribute('imagesizes',image.sizes);
  link.dataset.areHero=name;document.head.append(link);
 }
}
