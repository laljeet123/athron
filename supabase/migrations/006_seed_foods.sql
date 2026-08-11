-- Seed foods table with common nutrition values for Indian and global staples.

insert into foods (name, category, serving_size, serving_unit, calories, protein_g, carbs_g, fat_g, fiber_g, is_vegetarian)
values
  ('Rice', 'Grains', 100, 'g', 130, 2.4, 28.7, 0.3, 0.4, true),
  ('Dal', 'Legumes', 100, 'g', 116, 7.8, 20.1, 0.7, 4.1, true),
  ('Roti', 'Grains', 50, 'g', 120, 3.6, 20.0, 2.0, 2.0, true),
  ('Chapati', 'Grains', 50, 'g', 110, 3.3, 18.0, 1.8, 2.0, true),
  ('Paneer', 'Dairy', 100, 'g', 265, 18.3, 1.2, 20.8, 0.0, true),
  ('Milk', 'Dairy', 240, 'ml', 150, 8.0, 12.0, 8.0, 0.0, true),
  ('Curd', 'Dairy', 100, 'g', 98, 3.5, 4.7, 4.3, 0.0, true),
  ('Greek Yogurt', 'Dairy', 100, 'g', 120, 10.0, 4.0, 4.0, 0.0, true),
  ('Oats', 'Grains', 100, 'g', 389, 16.9, 66.3, 6.9, 10.6, true),
  ('Banana', 'Fruit', 100, 'g', 89, 1.1, 22.8, 0.3, 2.6, true),
  ('Apple', 'Fruit', 100, 'g', 52, 0.3, 14.0, 0.2, 2.4, true),
  ('Potato', 'Vegetables', 100, 'g', 77, 2.0, 17.0, 0.1, 2.2, true),
  ('Sweet Potato', 'Vegetables', 100, 'g', 86, 1.6, 20.1, 0.1, 3.0, true),
  ('Chickpeas', 'Legumes', 100, 'g', 364, 19.3, 60.7, 6.0, 17.4, true),
  ('Rajma', 'Legumes', 100, 'g', 329, 24.0, 60.0, 0.8, 13.0, true),
  ('Soy Chunks', 'Legumes', 100, 'g', 345, 52.0, 33.0, 0.5, 13.0, true),
  ('Tofu', 'Soy', 100, 'g', 76, 8.0, 1.9, 4.8, 0.3, true),
  ('Peanuts', 'Nuts', 28, 'g', 161, 7.3, 4.5, 14.0, 2.4, true),
  ('Almonds', 'Nuts', 28, 'g', 164, 6.0, 6.1, 14.2, 3.5, true),
  ('Peanut butter', 'Spread', 32, 'g', 188, 7.0, 6.0, 16.0, 1.9, true),
  ('Mixed Vegetables', 'Vegetables', 100, 'g', 65, 2.8, 11.0, 0.2, 3.0, true);
