// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* global document */
import {
  FlyToInterpolator,
  _deepEqual as deepEqual,
  _applyStyles as applyStyles,
  _removeStyles as removeStyles
} from '@deck.gl/core';
import type {Deck, Viewport, Widget, WidgetPlacement} from '@deck.gl/core';
import {render} from 'preact';
import {ButtonGroup, GroupedIconButton} from './components';

interface ZoomWidgetProps {
  id?: string;
  placement?: WidgetPlacement;
  /**
   * View to attach to and interact with. Required when using multiple views.
   */
  viewId?: string | null;
  /**
   * Button orientation.
   */
  orientation?: 'vertical' | 'horizontal';
  /**
   * Tooltip message on zoom in button.
   */
  zoomInLabel?: string;
  /**
   * Tooltip message on zoom out button.
   */
  zoomOutLabel?: string;
  /**
   * Zoom transition duration in ms.
   */
  transitionDuration?: number;
  /**
   * CSS inline style overrides.
   */
  style?: Partial<CSSStyleDeclaration>;
  /**
   * Additional CSS class.
   */
  className?: string;
}

export class ZoomWidget implements Widget<ZoomWidgetProps> {
  id = 'zoom';
  props: ZoomWidgetProps;
  placement: WidgetPlacement = 'top-left';
  orientation: 'vertical' | 'horizontal' = 'vertical';
  viewId?: string | null = null;
  viewports: {[id: string]: Viewport} = {};
  deck?: Deck<any>;
  element?: HTMLDivElement;

  constructor(props: ZoomWidgetProps) {
    this.id = props.id || 'zoom';
    this.viewId = props.viewId || null;
    this.placement = props.placement || 'top-left';
    this.orientation = props.orientation || 'vertical';
    props.transitionDuration = props.transitionDuration || 200;
    props.zoomInLabel = props.zoomInLabel || 'Zoom In';
    props.zoomOutLabel = props.zoomOutLabel || 'Zoom Out';
    props.style = props.style || {};
    this.props = props;
  }

  onAdd({deck}: {deck: Deck<any>}): HTMLDivElement {
    const {style, className} = this.props;
    const element = document.createElement('div');
    element.classList.add('deck-widget', 'deck-widget-zoom');
    if (className) element.classList.add(className);
    applyStyles(element, style);
    const ui = (
      <ButtonGroup orientation={this.orientation}>
        <GroupedIconButton
          onClick={() => this.handleZoomIn()}
          label={this.props.zoomInLabel}
          className="deck-widget-zoom-in"
        />
        <GroupedIconButton
          onClick={() => this.handleZoomOut()}
          label={this.props.zoomOutLabel}
          className="deck-widget-zoom-out"
        />
      </ButtonGroup>
    );
    render(ui, element);

    this.deck = deck;
    this.element = element;

    return element;
  }

  onRemove() {
    this.deck = undefined;
    this.element = undefined;
  }

  setProps(props: Partial<ZoomWidgetProps>) {
    const oldProps = this.props;
    const el = this.element;
    if (el) {
      if (oldProps.className !== props.className) {
        if (oldProps.className) el.classList.remove(oldProps.className);
        if (props.className) el.classList.add(props.className);
      }

      if (!deepEqual(oldProps.style, props.style, 1)) {
        removeStyles(el, oldProps.style);
        applyStyles(el, props.style);
      }
    }

    Object.assign(this.props, props);
  }

  onViewportChange(viewport: Viewport) {
    this.viewports[viewport.id] = viewport;
  }

  handleZoom(viewport: Viewport, nextZoom: number) {
    const viewId = this.viewId || viewport?.id || 'default-view';
    const nextViewState = {
      ...viewport,
      zoom: nextZoom,
      transitionDuration: this.props.transitionDuration,
      transitionInterpolator: new FlyToInterpolator()
    };
    // @ts-ignore Using private method temporary until there's a public one
    this.deck._onViewStateChange({viewId, viewState: nextViewState, interactionState: {}});
  }

  handleZoomIn() {
    for (const viewport of Object.values(this.viewports)) {
      this.handleZoom(viewport, viewport.zoom + 1);
    }
  }

  handleZoomOut() {
    for (const viewport of Object.values(this.viewports)) {
      this.handleZoom(viewport, viewport.zoom - 1);
    }
  }
}
