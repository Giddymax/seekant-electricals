-- Optional: seed the electrical shop starter inventory. Run after schema.sql.
insert into public.pos_products (name, generic_name, category, dosage_form, strength, manufacturer, batch_number, barcode, cost_price, price, quantity, reorder_level) values
  ('1.5mm Twin & Earth Cable','Lighting circuit cable','Cables & Wires','Roll','1.5mm, 100m','Reroy','CAB-1.5-TNE','SEL-1001',520,650,12,4),
  ('2.5mm Twin & Earth Cable','Socket circuit cable','Cables & Wires','Roll','2.5mm, 100m','Reroy','CAB-2.5-TNE','SEL-1002',780,950,10,4),
  ('4mm Single Core Cable','Power cable','Cables & Wires','Roll','4mm, 100m','Nexans','CAB-4-SC','SEL-1003',1100,1350,8,3),
  ('13A Double Socket','Wall outlet','Switches & Sockets','Piece','13A, 2 gang','Schneider Electric','SOC-13A-DBL','SEL-1004',28,45,45,12),
  ('1 Gang 1 Way Switch','Lighting switch','Switches & Sockets','Piece','10A','Legrand','SWT-1G1W','SEL-1005',12,20,80,20),
  ('LED Bulb','Energy saving bulb','Lighting','Piece','9W, E27','Philips','LGT-LED-9W','SEL-1006',10,18,120,30),
  ('LED Panel Light','Ceiling panel','Lighting','Piece','18W, square','Osram','LGT-PNL-18W','SEL-1007',55,80,24,8),
  ('6A Circuit Breaker','MCB','Breakers & Protection','Piece','6A, single pole','ABB','BRK-MCB-6A','SEL-1008',22,35,35,10),
  ('32A Circuit Breaker','MCB','Breakers & Protection','Piece','32A, single pole','ABB','BRK-MCB-32A','SEL-1009',28,45,30,10),
  ('63A RCCB','Earth leakage protection','Breakers & Protection','Piece','63A, 30mA','Schneider Electric','BRK-RCCB-63A','SEL-1010',120,175,14,5),
  ('PVC Conduit Pipe','Electrical conduit','Conduits & Trunking','Length','20mm','Interplast','CON-PVC-20','SEL-1011',9,15,100,25),
  ('PVC Trunking','Surface wiring trunking','Conduits & Trunking','Length','25x16mm','Interplast','TRK-25X16','SEL-1012',14,24,70,20),
  ('Distribution Board','Consumer unit','Distribution Boards','Piece','8 way','Hager','DB-8WAY','SEL-1013',160,230,12,4),
  ('Digital Multimeter','Electrical tester','Tools & Testers','Piece','AC/DC, continuity','UNI-T','TLS-DMM','SEL-1014',85,130,10,3),
  ('Insulation Tape','PVC electrical tape','Accessories','Roll','Black, 18mm','3M','ACC-TAPE-BLK','SEL-1015',4,8,160,40),
  ('Cable Clips','Cable fasteners','Accessories','Pack','10mm, 100 pcs','Generic','ACC-CLIP-10','SEL-1016',8,15,75,20)
on conflict do nothing;
