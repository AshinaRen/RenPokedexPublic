import { Component, ElementRef, input, ViewChild } from '@angular/core';
import { Pokemon } from '../../../pokemon/interfaces/pokemon-details.interface';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'poke-carrousel',
  imports: [],
  templateUrl: './carrousel.component.html',
})
export class CarrouselComponent {
  pokemon = input.required<Pokemon | undefined>()

@ViewChild('carousel') carousel!: ElementRef;

substitute = 'assets/images/substitute.png';

scrollTo(id: string) {
  const container = this.carousel.nativeElement as HTMLElement;
  const target = document.getElementById(id);

  if (container && target) {
    // Find the index of the target item
    const items = container.querySelectorAll('.carousel-item');
    const targetIndex = Array.from(items).findIndex(item => item.id === id);

    // Assume each item has the same width (e.g., container's clientWidth)
    const itemWidth = container.clientWidth;
    const targetOffset = targetIndex * itemWidth;

    container.scrollTo({
      left: targetOffset,
      behavior: 'smooth'
    });
  }
}


}
