import { Pipe, type PipeTransform } from '@angular/core';

@Pipe({
  name: 'replace',
})
export class ReplacePipe implements PipeTransform {

  transform(value: string): string {
    if (!value) return value; // Si el valor es nulo o vacío, devolverlo tal cual
    return value.replace(/-/g, ' '); // Reemplaza todos los guiones por espacios
  }

}
