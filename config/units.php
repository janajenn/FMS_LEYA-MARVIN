<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Linear Dimension Unit — SINGLE SOURCE OF TRUTH
    |--------------------------------------------------------------------------
    |
    | Every linear dimension entered or stored anywhere in the app uses this
    | unit: product standard sizes, per-part standard sizes, size templates,
    | and material stock attributes (thickness / width / length).
    |
    | Derived units are computed from inches inside MaterialCalculationService:
    |   - board feet  = (T_in × W_in × L_in) / 144
    |   - linear feet = L_in / 12
    |
    */

    'dimension'       => 'inches',
    'dimension_short' => 'in',
    'dimension_label' => 'Inches (in)',
];
