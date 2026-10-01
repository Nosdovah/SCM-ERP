-- Seed: Suppliers
INSERT INTO public.suppliers (name, company_name) VALUES
    ('Ju Teng International', 'MANUFACTURE'),
    ('Foxconn', 'MANUFACTURE'),
    ('Catcher Technology', 'MANUFACTURE'),
    ('Wistron', 'MANUFACTURE'),
    ('Pegatron', 'MANUFACTURE'),
    ('Compal Electronics', 'MANUFACTURE')
ON CONFLICT DO NOTHING;

-- Seed: Items (Chassis)
INSERT INTO public.items (sku, name, category, supplier_id, company_name, unit_price, stock_on_hand) VALUES
    ('CHA-OFF-L01', 'MSI Modern Series (Low): Full Polycarbonate, Slim Bezel',                     'Chassis', (SELECT id FROM public.suppliers WHERE name = 'Ju Teng International'), 'MANUFACTURE', 18.00, 10000),
    ('CHA-OFF-L02', 'ASUS Vivobook Go (Low): Plastic Composite, Antimicrobial Guard',              'Chassis', (SELECT id FROM public.suppliers WHERE name = 'Foxconn'),               'MANUFACTURE', 19.50, 10000),
    ('CHA-OFF-M01', 'Acer Swift Go (Mid): Anodized Aluminum Top, Plastic Base',                    'Chassis', (SELECT id FROM public.suppliers WHERE name = 'Catcher Technology'),     'MANUFACTURE', 35.00, 10000),
    ('CHA-OFF-M02', 'Lenovo IdeaPad Slim 5 (Mid): Half-Aluminum Chassis, Military Grade Std',      'Chassis', (SELECT id FROM public.suppliers WHERE name = 'Wistron'),                'MANUFACTURE', 38.00, 10000),
    ('CHA-OFF-H01', 'ASUS Zenbook S Series (High): Ceraluminum / Magnesium-Lithium Alloy',         'Chassis', (SELECT id FROM public.suppliers WHERE name = 'Foxconn'),               'MANUFACTURE', 85.00, 10000),
    ('CHA-OFF-H02', 'Acer Swift Edge (High): Ultra-Light Magnesium-Aluminum Alloy',                'Chassis', (SELECT id FROM public.suppliers WHERE name = 'Catcher Technology'),     'MANUFACTURE', 78.00, 10000),
    ('CHA-GAM-L01', 'MSI Thin / Cyborg (Low): Translucent Plastic Parts, Aluminum Top Cover',      'Chassis', (SELECT id FROM public.suppliers WHERE name = 'Ju Teng International'), 'MANUFACTURE', 25.00, 10000),
    ('CHA-GAM-L02', 'Acer Nitro V (Low): Textured Polycarbonate, Standard Dual-Venting',           'Chassis', (SELECT id FROM public.suppliers WHERE name = 'Pegatron'),               'MANUFACTURE', 24.00, 10000),
    ('CHA-GAM-M01', 'ASUS TUF Gaming (Mid): Aluminum Shield Top, Reinforced Honeycomb Base',       'Chassis', (SELECT id FROM public.suppliers WHERE name = 'Foxconn'),               'MANUFACTURE', 45.00, 10000),
    ('CHA-GAM-M02', 'Lenovo Legion 5 / LOQ (Mid): Injection-Molded Polymer, Rear I/O Venting Layout', 'Chassis', (SELECT id FROM public.suppliers WHERE name = 'Compal Electronics'),  'MANUFACTURE', 48.00, 10000),
    ('CHA-GAM-H01', 'MSI Raider / Titan (High): Full CNC Aluminum, Complex RGB Lightbar Chassis',  'Chassis', (SELECT id FROM public.suppliers WHERE name = 'Ju Teng International'), 'MANUFACTURE', 110.00, 10000),
    ('CHA-GAM-H02', 'ASUS ROG Zephyrus / Strix (High): CNC Aluminum Unibody, AniMe Matrix / Slash Lighting', 'Chassis', (SELECT id FROM public.suppliers WHERE name = 'Foxconn'), 'MANUFACTURE', 125.00, 10000),
    ('CHA-GAM-H03', 'Lenovo Legion Pro 7/9 (High): Die-Cast Aluminum-Magnesium, Carbon Fiber Top Cover', 'Chassis', (SELECT id FROM public.suppliers WHERE name = 'Compal Electronics'), 'MANUFACTURE', 130.00, 10000),
    ('CHA-BUS-L01', 'Lenovo ThinkPad E Series (Low): Thick Polycarbonate, Aluminum Top Option',    'Chassis', (SELECT id FROM public.suppliers WHERE name = 'Wistron'),                'MANUFACTURE', 22.00, 10000),
    ('CHA-BUS-L02', 'Acer TravelMate P2 (Low): Scratch-Resistant Plastic, Reinforced Ports',       'Chassis', (SELECT id FROM public.suppliers WHERE name = 'Pegatron'),               'MANUFACTURE', 20.00, 10000),
    ('CHA-BUS-M01', 'ASUS ExpertBook B3/B5 (Mid): Aluminum-Magnesium Top, Structural Internal Ribs', 'Chassis', (SELECT id FROM public.suppliers WHERE name = 'Foxconn'),             'MANUFACTURE', 42.00, 10000),
    ('CHA-BUS-M02', 'Lenovo ThinkPad L/T Series (Mid): Glass-Fiber Reinforced Plastic, Spill-Resistant Deck', 'Chassis', (SELECT id FROM public.suppliers WHERE name = 'Wistron'), 'MANUFACTURE', 55.00, 10000),
    ('CHA-BUS-H01', 'Lenovo ThinkPad X1 Carbon (High): Premium Aerospace-Grade Carbon Fiber Cover', 'Chassis', (SELECT id FROM public.suppliers WHERE name = 'Compal Electronics'), 'MANUFACTURE', 115.00, 10000),
    ('CHA-BUS-H02', 'MSI Prestige 16 AI (High): Ultra-Thin Magnesium-Aluminum Alloy',              'Chassis', (SELECT id FROM public.suppliers WHERE name = 'Ju Teng International'), 'MANUFACTURE', 90.00, 10000),
    ('CHA-BUS-H03', 'ASUS ExpertBook B9 (High): Premium Magnesium-Lithium Alloy, Featherlight Chassis', 'Chassis', (SELECT id FROM public.suppliers WHERE name = 'Foxconn'),           'MANUFACTURE', 105.00, 10000);
