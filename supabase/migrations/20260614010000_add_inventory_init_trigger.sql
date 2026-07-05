-- 家庭作成時にグローバルマスタ食材をinventoryに自動初期化するトリガー
-- ADR-0009: 在庫管理の設計方針

CREATE OR REPLACE FUNCTION public.handle_new_household()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.inventory (household_id, ingredient_id, in_stock)
  SELECT NEW.id, id, FALSE
  FROM public.ingredients
  WHERE household_id IS NULL;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_household_created
  AFTER INSERT ON public.households
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_household();
