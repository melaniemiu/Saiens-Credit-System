"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus, X, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

interface Category {
  id: string
  name: string
  color?: string
  icon?: string
}

interface CategoryComboInputProps {
  categories: Category[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  allowCreate?: boolean
  disabled?: boolean
  className?: string
  onCategoryCreated?: (category: Category) => void
}

export function CategoryComboInput({
  categories = [],
  value,
  onValueChange,
  placeholder = "選擇或輸入類別...",
  allowCreate = true,
  disabled = false,
  className,
  onCategoryCreated
}: CategoryComboInputProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")


  // Find the selected category
  const selectedCategory = categories.find((category) => category.name === value)

  // Filter categories based on search
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchValue.toLowerCase())
  )


  // Check if search value matches any existing category
  const exactMatch = categories.find(
    (category) => category.name.toLowerCase() === searchValue.toLowerCase()
  )

  // Handle selection
  const handleSelect = (categoryName: string) => {
    // Always set the selected category, don't toggle to empty
    onValueChange(categoryName)
    setOpen(false)
    setSearchValue("")
  }

  // Handle creating new category
  const handleCreateNew = () => {
    if (searchValue.trim() && !exactMatch) {
      const newCategoryName = searchValue.trim()
      onValueChange(newCategoryName)
      
      // Create a temporary category object for the callback
      const newCategory: Category = {
        id: `temp-${Date.now()}`, // Temporary ID
        name: newCategoryName
      }
      
      // Notify parent component that a new category was created
      if (onCategoryCreated) {
        onCategoryCreated(newCategory)
      }
      
      setOpen(false)
      setSearchValue("")
    }
  }

  // Handle clearing the selection
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onValueChange("")
  }

  // Update search value when input changes
  const handleSearchChange = (search: string) => {
    setSearchValue(search)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {selectedCategory ? (
              <>
                {selectedCategory.color && (
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: selectedCategory.color }}
                  />
                )}
                <span className="truncate">{selectedCategory.name}</span>
              </>
            ) : value ? (
              <span className="truncate">{value}</span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {(selectedCategory || value) && (
              <div
                className="flex items-center justify-center h-4 w-4 rounded hover:bg-muted cursor-pointer"
                onClick={handleClear}
              >
                <X className="h-3 w-3" />
              </div>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground">
          {/* Search Input */}
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="搜尋類別..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          
          {/* Category List */}
          <style jsx>{`
            .category-scroll::-webkit-scrollbar {
              width: 8px;
            }
            .category-scroll::-webkit-scrollbar-track {
              background: #f1f5f9;
            }
            .category-scroll::-webkit-scrollbar-thumb {
              background: #cbd5e1;
              border-radius: 4px;
            }
            .category-scroll::-webkit-scrollbar-thumb:hover {
              background: #94a3b8;
            }
          `}</style>
          <div 
            className="category-scroll max-h-[200px] overflow-y-scroll focus:outline-none"
            style={{
              scrollbarWidth: 'auto',
              scrollbarColor: '#9ca3af #f3f4f6',
              scrollbarGutter: 'stable',
              touchAction: 'pan-y'
            }}
            tabIndex={0}
            onWheel={(e) => {
              e.stopPropagation()
            }}
            onTouchMove={(e) => {
              e.stopPropagation()
            }}
          >
            {/* Empty State */}
            {filteredCategories.length === 0 && (
              <div className="py-6 text-center text-sm">
                {searchValue ? (
                  allowCreate && !exactMatch ? (
                    <div className="p-2">
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-2 h-auto p-2"
                        onClick={handleCreateNew}
                      >
                        <Plus className="h-4 w-4" />
                        <span>創建 "{searchValue}"</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      找不到類別
                    </div>
                  )
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    輸入以搜尋類別
                  </div>
                )}
              </div>
            )}
            
            {/* Categories */}
            {filteredCategories.length > 0 && (
              <div className="overflow-hidden p-1 text-foreground">
                {filteredCategories.map((category) => (
                  <div
                    key={category.id}
                    className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleSelect(category.name)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === category.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {category.color && (
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0 mr-2"
                        style={{ backgroundColor: category.color }}
                      />
                    )}
                    <span className="flex-1 truncate">{category.name}</span>
                    {category.icon && (
                      <span className="text-muted-foreground text-xs">
                        {category.icon}
                      </span>
                    )}
                  </div>
                ))}
                
                {/* Create new option when searching and categories exist */}
                {searchValue && allowCreate && !exactMatch && (
                  <div className="border-t pt-1 mt-1">
                    <div
                      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                      onClick={handleCreateNew}
                    >
                      <Plus className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>創建新類別 "{searchValue}"</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Display component for showing selected category with color
interface CategoryDisplayProps {
  category?: Category
  value?: string
  className?: string
}

export function CategoryDisplay({ category, value, className }: CategoryDisplayProps) {
  if (!category && !value) return null

  return (
    <Badge variant="outline" className={cn("gap-2", className)}>
      {category?.color && (
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: category.color }}
        />
      )}
      <span>{category?.name || value}</span>
    </Badge>
  )
}