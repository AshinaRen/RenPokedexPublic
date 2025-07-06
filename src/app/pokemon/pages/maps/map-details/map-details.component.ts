import { Component, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@pokemon/auth/services/auth.service';
import { TitleComponent } from '@shared/components/title/title.component';

/**
 * @component
 * @selector app-map-details
 * @standalone true
 * @imports [TitleComponent]
 * @templateUrl ./map-details.component.html
 * @styleUrl map-details.component.scss
 *
 * @description
 * Componente standalone que muestra un mapa interactivo con soporte para zoom y desplazamiento (pan).
 * Permite al usuario interactuar con una imagen de mapa mediante eventos de ratón o táctiles, ajustando
 * el nivel de zoom y la posición del mapa dentro de un contenedor. Obtiene el identificador del mapa
 * desde los parámetros de la URL.
 */
@Component({
  selector: 'app-map-details',
  templateUrl: './map-details.component.html',
  styleUrl: './map-details.component.scss',
  imports: [TitleComponent]
})
export class MapDetailsComponent implements AfterViewInit {
  /**
   * @private
   * @description
   * Servicio de Angular Router para obtener parámetros de la URL, como el identificador del mapa.
   */
  private route = inject(ActivatedRoute);
  authService = inject(AuthService);
  router = inject(Router);

  /**
   * @public
   * @description
   * Referencia al contenedor del mapa en el DOM, utilizado para calcular los límites de desplazamiento.
   */
  @ViewChild('mapFrame') mapFrame!: ElementRef<HTMLDivElement>;

  /**
   * @public
   * @description
   * Referencia a la imagen del mapa en el DOM, utilizada para obtener dimensiones y aplicar transformaciones.
   */
  @ViewChild('mapImage') mapImage!: ElementRef<HTMLImageElement>;

  /**
   * @public
   * @description
   * Identificador del mapa extraído de los parámetros de la URL.
   */
  mapId = this.route.snapshot.paramMap.get('id');

  /**
   * @public
   * @description
   * Nivel de zoom actual del mapa. Valor inicial: 1 (escala normal).
   */
  zoomLevel = 1;

  /**
   * @public
   * @description
   * Desplazamiento horizontal del mapa (en píxeles) relativo al centro del contenedor.
   */
  panX = 0;

  /**
   * @public
   * @description
   * Desplazamiento vertical del mapa (en píxeles) relativo al centro del contenedor.
   */
  panY = 0;

  /**
   * @public
   * @description
   * Indica si el usuario está realizando un desplazamiento (pan) del mapa.
   */
  isPanning = false;

  /**
   * @public
   * @description
   * Coordenada X inicial del ratón o toque al comenzar el desplazamiento.
   */
  startX = 0;

  /**
   * @public
   * @description
   * Coordenada Y inicial del ratón o toque al comenzar el desplazamiento.
   */
  startY = 0;

  /**
   * @public
   * @description
   * Valor inicial de `panX` al comenzar el desplazamiento.
   */
  startPanX = 0;

  /**
   * @public
   * @description
   * Valor inicial de `panY` al comenzar el desplazamiento.
   */
  startPanY = 0;

  /**
   * @public
   * @description
   * Ancho natural de la imagen del mapa (en píxeles).
   */
  imageWidth = 0;

  /**
   * @public
   * @description
   * Alto natural de la imagen del mapa (en píxeles).
   */
  imageHeight = 0;

  /**
   * @public
   * @method ngAfterViewInit
   * @description
   * Hook del ciclo de vida de Angular que se ejecuta después de que las vistas del componente
   * hayan sido inicializadas. Inicializa las dimensiones de la imagen del mapa.
   */
  ngAfterViewInit() {
    // Inicializar dimensiones de la imagen cuando se cargue
    // No call updateImageDimensions here, it will be called by onImageLoad once the image is ready
  }

  /**
   * @public
   * @method onImageLoad
   * @description
   * Manejador del evento de carga de la imagen del mapa. Actualiza las dimensiones de la imagen
   * y ajusta los límites de desplazamiento para mantener el mapa dentro del contenedor.
   */
  onImageLoad() {
    this.updateImageDimensions();
    this.centerImageInitially(); // Call new method to center
    this.adjustPanLimits();
  }

  /**
   * @private
   * @method updateImageDimensions
   * @description
   * Actualiza las propiedades `imageWidth` y `imageHeight` con las dimensiones naturales
   * de la imagen del mapa. Se ejecuta al cargar la imagen o inicializar la vista.
   */
  private updateImageDimensions() {
    if (this.mapImage) {
      const img = this.mapImage.nativeElement;
      this.imageWidth = img.naturalWidth;
      this.imageHeight = img.naturalHeight;

      // Adjust mapFrame height to match image aspect ratio
      if (this.mapFrame && this.imageWidth > 0 && this.imageHeight > 0) {
        const frameWidth = this.mapFrame.nativeElement.clientWidth;
        this.mapFrame.nativeElement.style.height = `${frameWidth * (this.imageHeight / this.imageWidth)}px`;
      }
    }
  }

  /**
   * @private
   * @method centerImageInitially
   * @description
   * Centers the image within the map frame when it loads.
   */
  private centerImageInitially() {
    if (this.mapFrame && this.mapImage) {
      const frameRect = this.mapFrame.nativeElement.getBoundingClientRect();
      const imgRect = this.mapImage.nativeElement.getBoundingClientRect();

      // Calculate the offset needed to center the image within the frame
      // This assumes zoomLevel is 1 initially, which it is.
      this.panX = (frameRect.width - imgRect.width) / 2;
      this.panY = (frameRect.height - imgRect.height) / 2;
    }
  }

  /**
   * @public
   * @method startPan
   * @param event - Evento de ratón o táctil que inicia el desplazamiento.
   * @description
   * Inicia el proceso de desplazamiento (pan) del mapa. Registra las coordenadas iniciales
   * del ratón o toque y activa el estado de desplazamiento, aplicando una clase CSS para
   * indicar que el mapa está siendo arrastrado.
   */
  startPan(event: MouseEvent | TouchEvent) {
    event.preventDefault();
    this.isPanning = true;
    this.mapImage.nativeElement.classList.add('dragging');

    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;

    this.startX = clientX;
    this.startY = clientY;
    this.startPanX = this.panX;
    this.startPanY = this.panY;
  }

  /**
   * @public
   * @method pan
   * @param event - Evento de ratón o táctil durante el desplazamiento.
   * @description
   * Actualiza la posición del mapa (`panX` y `panY`) según el movimiento del ratón o toque.
   * Aplica límites para evitar que el mapa se desplace fuera del contenedor, ajustando
   * los cálculos según el nivel de zoom.
   */
  pan(event: MouseEvent | TouchEvent) {
    if (!this.isPanning) return;

    event.preventDefault();

    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;

    const deltaX = (clientX - this.startX) / this.zoomLevel;
    const deltaY = (clientY - this.startY) / this.zoomLevel;

    const newPanX = this.startPanX + deltaX;
    const newPanY = this.startPanY + deltaY;

    // Aplicar límites
    const frame = this.mapFrame.nativeElement;
    const frameRect = frame.getBoundingClientRect();
    const scaledWidth = this.imageWidth * this.zoomLevel;
    const scaledHeight = this.imageHeight * this.zoomLevel;

    // Calculate maximum pan offsets to keep the image within the frame
    // This logic ensures the edges of the scaled image align with the frame's edges.
    const maxPanX = Math.max(0, (scaledWidth - frameRect.width) / 2 / this.zoomLevel);
    const maxPanY = Math.max(0, (scaledHeight - frameRect.height) / 2 / this.zoomLevel);

    this.panX = Math.max(-maxPanX, Math.min(maxPanX, newPanX));
    this.panY = Math.max(-maxPanY, Math.min(maxPanY, newPanY));
  }

  /**
   * @public
   * @method endPan
   * @description
   * Finaliza el proceso de desplazamiento (pan) del mapa. Desactiva el estado de desplazamiento
   * y elimina la clase CSS que indica que el mapa está siendo arrastrado.
   */
  endPan() {
    this.isPanning = false;
    this.mapImage.nativeElement.classList.remove('dragging');
  }

  /**
   * @public
   * @method zoomIn
   * @description
   * Aumenta el nivel de zoom del mapa en 0.2, hasta un máximo de 3. Ajusta los límites
   * de desplazamiento tras el cambio de zoom.
   */
  zoomIn() {
    if (this.zoomLevel < 3) {
      this.adjustZoom(this.zoomLevel + 0.2);
    }
  }

  /**
   * @public
   * @method zoomOut
   * @description
   * Disminuye el nivel de zoom del mapa en 0.2, hasta un mínimo de 0.5. Ajusta los límites
   * de desplazamiento tras el cambio de zoom.
   */
  zoomOut() {
    if (this.zoomLevel > 0.5) {
      this.adjustZoom(this.zoomLevel - 0.2);
    }
  }

  /**
   * @private
   * @method adjustZoom
   * @param newZoomLevel - Nuevo nivel de zoom a aplicar.
   * @description
   * Actualiza el nivel de zoom del mapa y ajusta los límites de desplazamiento para
   * mantener el mapa dentro del contenedor.
   */
  private adjustZoom(newZoomLevel: number) {
    const oldZoomLevel = this.zoomLevel;
    const centerX = this.panX + (this.mapFrame.nativeElement.clientWidth / 2 / oldZoomLevel);
    const centerY = this.panY + (this.mapFrame.nativeElement.clientHeight / 2 / oldZoomLevel);

    this.zoomLevel = newZoomLevel;

    this.panX = centerX - (this.mapFrame.nativeElement.clientWidth / 2 / newZoomLevel);
    this.panY = centerY - (this.mapFrame.nativeElement.clientHeight / 2 / newZoomLevel);

    this.adjustPanLimits();
  }

  /**
   * @private
   * @method adjustPanLimits
   * @description
   * Calcula y aplica los límites máximos de desplazamiento (`panX` y `panY`) según
   * el tamaño del contenedor, el tamaño escalado de la imagen y el nivel de zoom actual.
   * Asegura que el mapa no se desplace más allá de los bordes visibles.
   */
  private adjustPanLimits() {
    const frame = this.mapFrame.nativeElement;
    const frameRect = frame.getBoundingClientRect();
    const scaledWidth = this.imageWidth * this.zoomLevel;
    const scaledHeight = this.imageHeight * this.zoomLevel;

    const overflowX = Math.max(0, scaledWidth - frameRect.width) / 2;
    const overflowY = Math.max(0, scaledHeight - frameRect.height) / 2;

    const maxPanX = overflowX / this.zoomLevel;
    const maxPanY = overflowY / this.zoomLevel;

    this.panX = Math.max(-maxPanX, Math.min(maxPanX, this.panX));
    this.panY = Math.max(-maxPanY, Math.min(maxPanY, this.panY));
  }

  ngOnInit(){
    if (!this.authService.isLoggedIn()) {
        this.router.navigateByUrl('/');
        return;
      }
  }
}
