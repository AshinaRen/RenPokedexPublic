import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '@env/environment';


const baseUrl = environment.baseUrl;

@Pipe({
  name: 'pokeImage'
})

export class PokeImagePipe implements PipeTransform {
  transform(value:null | string | string[]): string {

    if ( typeof value === 'string' && value.startsWith('blob:')){
      return value;
    }

    if (value === null) {
      return './assets/images/placeholder.jpg'
    }

    if ( typeof value === 'string' ){
      return `${ baseUrl }/files/product/${ value }`
    }

    const image = value![0];

    if( !image){
      return './assets/images/placeholder.jpg'
    }

    return `${ baseUrl }/files/product/${ image }`

  }
}
